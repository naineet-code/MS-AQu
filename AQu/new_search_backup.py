# %pip install tiktoken pypdf nltk openai pydantic --quiet

import re
import tiktoken
from nltk.tokenize import sent_tokenize
import nltk
import ssl
from typing import List, Dict, Any, Tuple
import os
from dotenv import load_dotenv
import time
import concurrent.futures
import json
from openai import AzureOpenAI
import requests
from io import BytesIO
import httpx

# Load environment variables
load_dotenv()

# Download nltk data if not already present
try:
    _create_unverified_https_context = ssl._create_unverified_context
except AttributeError:
    pass
else:
    ssl._create_default_https_context = _create_unverified_https_context

try:
    nltk.data.find('tokenizers/punkt_tab')
except LookupError:
    nltk.download('punkt_tab', quiet=True)

# Global tokenizer name to use consistently throughout the code
TOKENIZER_NAME = "cl100k_base"

def split_into_50_chunks(text: str, min_tokens: int = 500) -> List[Dict[str, Any]]:
    """
    Split text into up to 30 chunks, respecting sentence boundaries and ensuring
    each chunk has at least min_tokens (unless it's the last chunk).

    Args:
        text: The text to split
        min_tokens: The minimum number of tokens per chunk (default: 500)

    Returns:
        A list of dictionaries where each dictionary has:
        - id: The chunk ID (0-29)
        - text: The chunk text content
        - pages: List of page numbers this chunk belongs to
    """
    try:
        # First, split the text into sentences
        sentences = sent_tokenize(text)

        # Get tokenizer for counting tokens
        tokenizer = tiktoken.get_encoding(TOKENIZER_NAME)

        # Create chunks that respect sentence boundaries and minimum token count
        chunks = []
        current_chunk_sentences = []
        current_chunk_tokens = 0
        current_page = 1  # Default page number

        for sentence in sentences:
            # Check if this sentence contains a page number marker
            page_match = re.search(r'\[Page (\d+)\]', sentence)
            if page_match:
                current_page = int(page_match.group(1))
                # Remove the page number marker from the sentence
                sentence = re.sub(r'\[Page \d+\]\n', '', sentence)

            # Count tokens in this sentence
            sentence_tokens = len(tokenizer.encode(sentence))

            # If adding this sentence would make the chunk too large AND we already have the minimum tokens,
            # finalize the current chunk and start a new one
            if (current_chunk_tokens + sentence_tokens > min_tokens * 2) and current_chunk_tokens >= min_tokens:
                chunk_text = " ".join(current_chunk_sentences)
                chunks.append({
                    "id": len(chunks),  # Integer ID instead of string
                    "text": chunk_text,
                    "pages": [current_page]
                })
                current_chunk_sentences = [sentence]
                current_chunk_tokens = sentence_tokens
            else:
                # Add this sentence to the current chunk
                current_chunk_sentences.append(sentence)
                current_chunk_tokens += sentence_tokens

        # Add the last chunk if there's anything left
        if current_chunk_sentences:
            chunk_text = " ".join(current_chunk_sentences)
            chunks.append({
                "id": len(chunks),  # Integer ID instead of string
                "text": chunk_text,
                "pages": [current_page]
            })

        # If we have more than 30 chunks, consolidate them
        if len(chunks) > 30:
            # Recombine all text
            all_text = " ".join(chunk["text"] for chunk in chunks)
            # Re-split into exactly 30 chunks, without minimum token requirement
            sentences = sent_tokenize(all_text)
            sentences_per_chunk = len(sentences) // 30 + (1 if len(sentences) % 30 > 0 else 0)

            chunks = []
            current_page = 1
            for i in range(0, len(sentences), sentences_per_chunk):
                # Get the sentences for this chunk
                chunk_sentences = sentences[i:i+sentences_per_chunk]
                # Check for page number in any sentence
                for sentence in chunk_sentences:
                    page_match = re.search(r'\[Page (\d+)\]', sentence)
                    if page_match:
                        current_page = int(page_match.group(1))
                        break
                # Join the sentences into a single text
                chunk_text = " ".join(chunk_sentences)
                # Create a chunk object with ID and text
                chunks.append({
                    "id": len(chunks),  # Integer ID instead of string
                    "text": chunk_text,
                    "pages": [current_page]
                })

        # Print chunk statistics
        print(f"Split document into {len(chunks)} chunks")
        for i, chunk in enumerate(chunks):
            token_count = len(tokenizer.encode(chunk["text"]))
            print(f"Chunk {i}: {token_count} tokens, Pages: {chunk['pages']}")

        return chunks
    except Exception as e:
        print(f"Error in split_into_50_chunks: {str(e)}")
        return [{"id": 0, "text": text, "pages": [1]}]

# Import credentials manager
import sys
from pathlib import Path
sys.path.append(str(Path(__file__).parent))
from config.credentials import get_azure_config

# Global client variables - will be initialized when needed
client_mini = None
client_nano = None
deployment_mini = None
deployment_nano = None

def get_mini_client():
    """Get or initialize the mini client."""
    global client_mini, deployment_mini
    if client_mini is None:
        try:
            config = get_azure_config('mini')
            
            client_mini = AzureOpenAI(
                api_key=config['api_key'],
                api_version=config['api_version'],
                azure_endpoint=config['endpoint'],
                http_client=httpx.Client()
            )
            deployment_mini = config['deployment_name']
            print(f"Mini client initialized successfully with deployment: {deployment_mini}")
            
        except Exception as e:
            print(f"Error initializing mini client: {str(e)}")
            raise ValueError(f"Failed to initialize Azure OpenAI Mini client: {str(e)}")
    
    return client_mini, deployment_mini

def get_nano_client():
    """Get or initialize the nano client."""
    global client_nano, deployment_nano
    if client_nano is None:
        try:
            config = get_azure_config('nano')
            
            client_nano = AzureOpenAI(
                api_key=config['api_key'],
                api_version=config['api_version'],
                azure_endpoint=config['endpoint'],
                http_client=httpx.Client()
            )
            deployment_nano = config['deployment_name']
            print(f"Nano client initialized successfully with deployment: {deployment_nano}")
            
        except Exception as e:
            print(f"Error initializing nano client: {str(e)}")
            raise ValueError(f"Failed to initialize Azure OpenAI Nano client: {str(e)}")
    
    return client_nano, deployment_nano

def create_routing_prompt(question: str, chunks: List[Dict], depth: int, scratchpad: str) -> str:
    """Create a prompt for routing chunks based on the question."""
    prompt = f"""You are a routing system that helps find relevant information in a document.
Your task is to identify which chunks of text are most relevant to answering the following question:

QUESTION: {question}

{scratchpad if scratchpad else ""}

Here are the chunks to evaluate. For each chunk, determine if it contains information relevant to answering the question.
Respond with a JSON object containing:
1. "selected_ids": List of chunk IDs that contain relevant information
2. "scratchpad": Your reasoning about why these chunks are relevant

CHUNKS:
"""
    
    for chunk in chunks:
        prompt += f"\nChunk {chunk['id']}:\n{chunk['text']}\n"
    
    return prompt

def get_routing_decision(prompt: str) -> Dict:
    """Get routing decision from the model."""
    try:
        start_time = time.time()
        
        client, deployment = get_nano_client()
        response = client.chat.completions.create(
            model=deployment,
            messages=[
                {"role": "system", "content": "Select relevant chunks. Return JSON with 'selected_ids' and brief 'scratchpad'."},
                {"role": "user", "content": prompt}
            ],
            response_format={"type": "json_object"},
            temperature=0.3,
            max_tokens=800  # Increased from 300 to prevent truncation
        )
        
        api_time = time.time() - start_time
        print(f"API call took {api_time:.2f} seconds")
        
        response_content = response.choices[0].message.content.strip()
        
        # Try to parse the JSON response
        try:
            decision = json.loads(response_content)
        except json.JSONDecodeError as json_error:
            print(f"JSON parsing error: {json_error}")
            print(f"Full response content: {repr(response_content)}")  # Show full content with quotes
            
            # Try multiple repair strategies
            fixed_content = response_content
            
            # Strategy 1: Remove trailing commas and incomplete strings
            if fixed_content.endswith('",') or fixed_content.endswith('"'):
                fixed_content = fixed_content.rstrip('",')
                if not fixed_content.endswith('}'):
                    fixed_content += '"}'
            
            # Strategy 2: Handle incomplete arrays
            if '"selected_ids": [' in fixed_content and not (']' in fixed_content.split('"selected_ids": [')[1]):
                # Array is incomplete, close it
                parts = fixed_content.split('"selected_ids": [')
                if len(parts) == 2:
                    fixed_content = parts[0] + '"selected_ids": []'
                    if not fixed_content.endswith('}'):
                        fixed_content += ', "scratchpad": ""}'
            
            # Strategy 3: Handle incomplete objects
            open_braces = fixed_content.count('{')
            close_braces = fixed_content.count('}')
            if open_braces > close_braces:
                # Add missing closing braces
                fixed_content += '}' * (open_braces - close_braces)
            
            # Strategy 4: Handle incomplete strings in scratchpad
            if '"scratchpad": "' in fixed_content:
                parts = fixed_content.split('"scratchpad": "')
                if len(parts) == 2 and not parts[1].count('"') >= 1:
                    # Incomplete scratchpad string
                    fixed_content = parts[0] + '"scratchpad": "Incomplete response"}'
            
            # Try parsing with fixes
            try:
                decision = json.loads(fixed_content)
                print(f"Successfully repaired JSON: {fixed_content[:100]}...")
            except json.JSONDecodeError as repair_error:
                print(f"Could not repair JSON: {repair_error}")
                print(f"Attempted fix: {repr(fixed_content[:100])}")
                # Last resort: create a minimal valid response
                decision = {"selected_ids": [], "scratchpad": f"JSON repair failed: {str(json_error)}"}
        
        # Validate the structure
        if not isinstance(decision.get("selected_ids"), list):
            decision["selected_ids"] = []
        if not isinstance(decision.get("scratchpad"), str):
            decision["scratchpad"] = ""
            
        return decision
    except Exception as e:
        print(f"Error getting routing decision: {e}")
        return {"selected_ids": [], "scratchpad": f"Error in routing: {str(e)}"}

def process_batch(args: Tuple[str, List[Dict], int, int]) -> Dict:
    """Process a single batch of chunks."""
    question, batch_chunks, batch_num, total_batches = args
    batch_start_time = time.time()
    
    print(f"\nProcessing batch {batch_num} of {total_batches}")
    print(f"Chunks {batch_chunks[0]['id']} to {batch_chunks[-1]['id']}")
    
    # Create a prompt for the batch with more explicit reasoning requirements
    batch_prompt = f"""You are a routing system that helps find relevant information in a document.
Your task is to identify which chunks of text are most relevant to answering the following question:

QUESTION: {question}

For each chunk, you MUST:
1. Evaluate if it contains information relevant to the question
2. Explain WHY you selected or rejected each chunk
3. Provide detailed reasoning about the relevance of selected chunks

Respond with a JSON object containing:
1. "selected_ids": List of chunk IDs that contain relevant information
2. "scratchpad": Your detailed reasoning about why these chunks are relevant, including:
   - Why each selected chunk is relevant to the question
   - How the information in each chunk helps answer the question
   - Any connections between different chunks

CHUNKS:
"""
    
    for chunk in batch_chunks:
        batch_prompt += f"\nChunk {chunk['id']}:\n{chunk['text']}\n"
    
    # Get routing decision
    routing_decision = get_routing_decision(batch_prompt)
    
    # Ensure scratchpad is not empty
    if not routing_decision.get("scratchpad"):
        routing_decision["scratchpad"] = f"Selected chunks {routing_decision['selected_ids']} based on relevance to the question: {question}"
    
    batch_time = time.time() - batch_start_time
    print(f"Batch {batch_num} completed in {batch_time:.2f} seconds")
    
    return routing_decision

def route_chunks(question: str, chunks: List[Dict], depth: int = 0, scratchpad: str = "") -> Dict:
    """Route chunks to find the most relevant ones for the question."""
    print(f"\n==== ROUTING AT DEPTH {depth} ====")
    
    start_time = time.time()
    timeout = 20  # Increased from 15 to 20 seconds
    max_chunks_per_batch = 15  # Reduced from 20 to 15 chunks per batch for better reasoning
    min_chunks_to_find = 3
    total_chunks = len(chunks)
    
    print(f"Total chunks to evaluate: {total_chunks}")
    print(f"Timeout: {timeout} seconds")
    print(f"Chunks per batch: {max_chunks_per_batch}")
    
    # Prepare batches
    batches = []
    for i in range(0, total_chunks, max_chunks_per_batch):
        batch_chunks = chunks[i:i + max_chunks_per_batch]
        batch_num = i//max_chunks_per_batch + 1
        total_batches = (total_chunks + max_chunks_per_batch - 1)//max_chunks_per_batch
        batches.append((question, batch_chunks, batch_num, total_batches))
        print(f"\nBatch {batch_num}/{total_batches}:")
        for chunk in batch_chunks:
            print(f"Chunk {chunk['id']}: {chunk['text'][:100]}...")
    
    # Process batches in parallel
    all_selected_ids = set()
    all_scratchpad = []
    
    for batch in batches:
        question, batch_chunks, batch_num, total_batches = batch
        print(f"\nProcessing batch {batch_num}/{total_batches}")
        
        # Create prompt for this batch
        prompt = f"""Question: {question}

Context:
{json.dumps(batch_chunks, indent=2)}

Instructions:
1. Select the most relevant chunks that help answer the question
2. Consider both direct matches and semantic relevance
3. Return a JSON object with:
   - selected_ids: List of chunk IDs that are relevant
   - reasoning: Brief explanation of why these chunks are relevant
4. If no chunks are relevant, return an empty list for selected_ids

Response:"""

        try:
            # Call the model
            client, deployment = get_mini_client()
            response = client.chat.completions.create(
                model=deployment,
                messages=[
                    {"role": "system", "content": "You are a helpful AI assistant that selects relevant text chunks."},
                    {"role": "user", "content": prompt}
                ],
                temperature=0.3,
                max_tokens=500
            )
            
            # Parse response
            result = json.loads(response.choices[0].message.content.strip())
            selected_ids = result.get("selected_ids", [])
            reasoning = result.get("reasoning", "")
            
            print(f"\nBatch {batch_num} results:")
            print(f"Selected IDs: {selected_ids}")
            print(f"Reasoning: {reasoning}")
            
            # Add selected IDs to the set
            all_selected_ids.update(selected_ids)
            all_scratchpad.append(reasoning)
            
        except Exception as e:
            print(f"Error processing batch {batch_num}: {str(e)}")
            continue
    
    # If we found fewer than min_chunks_to_find chunks, try to find more
    if len(all_selected_ids) < min_chunks_to_find and depth == 0:
        print(f"\nFound only {len(all_selected_ids)} chunks, trying to find more...")
        # Try with a more lenient prompt
        prompt = f"""Question: {question}

Context:
{json.dumps(chunks, indent=2)}

Instructions:
1. Select ANY chunks that might be relevant to the question, even if indirectly
2. Consider both direct matches and semantic relevance
3. Return a JSON object with:
   - selected_ids: List of chunk IDs that are relevant
   - reasoning: Brief explanation of why these chunks are relevant
4. Try to find at least {min_chunks_to_find} chunks

Response:"""

        try:
            client, deployment = get_mini_client()
            response = client.chat.completions.create(
                model=deployment,
                messages=[
                    {"role": "system", "content": "You are a helpful AI assistant that selects relevant text chunks."},
                    {"role": "user", "content": prompt}
                ],
                temperature=0.3,
                max_tokens=500
            )
            
            result = json.loads(response.choices[0].message.content.strip())
            selected_ids = result.get("selected_ids", [])
            reasoning = result.get("reasoning", "")
            
            print(f"\nAdditional chunks found:")
            print(f"Selected IDs: {selected_ids}")
            print(f"Reasoning: {reasoning}")
            
            all_selected_ids.update(selected_ids)
            all_scratchpad.append(reasoning)
            
        except Exception as e:
            print(f"Error finding additional chunks: {str(e)}")
    
    print(f"\nFinal results:")
    print(f"Total selected chunks: {len(all_selected_ids)}")
    print(f"Selected IDs: {all_selected_ids}")
    
    return {
        "selected_ids": list(all_selected_ids),
        "scratchpad": "\n".join(all_scratchpad)
    }

def navigate_to_paragraphs(document_text: str, question: str, max_depth: int = 1, chunks: List[Dict[str, Any]] = None) -> Dict[str, Any]:
    """
    Navigate through the document hierarchy to find relevant paragraphs.

    Args:
        document_text: The full document text
        question: The user's question
        max_depth: Maximum depth to navigate before returning paragraphs (default: 1)
        chunks: Pre-computed chunks to use (optional)

    Returns:
        Dictionary with selected paragraphs and final scratchpad
    """
    try:
        print(f"\nProcessing question: {question}")
        print(f"Document text length: {len(document_text)} characters")
        print(f"First 500 characters: {document_text[:500]}")

        scratchpad = ""

        # Use provided chunks or create new ones
        if chunks is None:
            chunks = split_into_50_chunks(document_text, min_tokens=500)
            print(f"Split document into {len(chunks)} chunks")

        # Navigator state - track chunk paths to maintain hierarchy
        chunk_paths = {}  # Maps numeric IDs to path strings for display
        for chunk in chunks:
            chunk_paths[chunk["id"]] = str(chunk["id"])

        # Navigate through levels until max_depth or until no chunks remain
        for current_depth in range(max_depth + 1):
            print(f"\nNavigating at depth {current_depth}")
            
            # Call router to get relevant chunks
            result = route_chunks(question, chunks, current_depth, scratchpad)

            # Update scratchpad
            scratchpad = result["scratchpad"]

            # Get selected chunks
            selected_ids = result["selected_ids"]
            selected_chunks = [c for c in chunks if c["id"] in selected_ids]

            # If no chunks were selected, return empty result
            if not selected_chunks:
                print("\nNo relevant chunks found.")
                return {"paragraphs": [], "scratchpad": scratchpad}

            # If we've reached max_depth, return the selected chunks
            if current_depth == max_depth:
                print(f"\nReturning {len(selected_chunks)} relevant chunks at depth {current_depth}")

                # Update display IDs and format paragraphs
                formatted_chunks = []
                for chunk in selected_chunks:
                    # Extract page number from the text
                    page_match = re.search(r'\[Page (\d+)\]', chunk["text"])
                    page_num = page_match.group(1) if page_match else "1"
                    
                    # Remove page number marker from text
                    clean_text = re.sub(r'\[Page \d+\]\n', '', chunk["text"])
                    
                    formatted_chunk = {
                        "id": chunk["id"],
                        "display_id": chunk_paths[chunk["id"]],
                        "text": clean_text,
                        "pages": [int(page_num)]  # Store as list of integers
                    }
                    formatted_chunks.append(formatted_chunk)
                    print(f"\nSelected chunk {chunk['id']} from page {page_num}")
                    print(f"Content: {clean_text[:200]}...")

                return {"paragraphs": formatted_chunks, "scratchpad": scratchpad}

            # Prepare next level by splitting selected chunks further
            next_level_chunks = []
            next_chunk_id = 0  # Counter for new chunks

            for chunk in selected_chunks:
                # Split this chunk into smaller pieces
                sub_chunks = split_into_50_chunks(chunk["text"], min_tokens=200)

                # Update IDs and maintain path mapping
                for sub_chunk in sub_chunks:
                    path = f"{chunk_paths[chunk['id']]}.{sub_chunk['id']}"
                    sub_chunk["id"] = next_chunk_id
                    # Extract and preserve page number
                    page_match = re.search(r'\[Page (\d+)\]', chunk["text"])
                    sub_chunk["pages"] = [int(page_match.group(1))] if page_match else [1]
                    chunk_paths[next_chunk_id] = path
                    next_level_chunks.append(sub_chunk)
                    next_chunk_id += 1

            # Update chunks for next iteration
            chunks = next_level_chunks

        # If we get here, return the last selected chunks
        return {"paragraphs": selected_chunks, "scratchpad": scratchpad}
    except Exception as e:
        print(f"Error in navigate_to_paragraphs: {str(e)}")
        return {"paragraphs": [], "scratchpad": f"Error processing document: {str(e)}"}

from pydantic import BaseModel, field_validator

class Answer(BaseModel):
    """Structured response format for questions"""
    answer: str
    citations: List[Dict[str, str]]  # Changed from List[str] to List[Dict[str, str]]
    usage: Dict[str, int] = {
        "total_tokens": 0,
        "prompt_tokens": 0,
        "completion_tokens": 0
    }
    cost: Dict[str, float] = {
        "input_cost": 0.0,
        "output_cost": 0.0,
        "total_cost": 0.0
    }

    @field_validator('citations')
    def validate_citations(cls, citations, info):
        # Access valid_citations from the model_config
        valid_citations = info.data.get('_valid_citations', [])
        if valid_citations:
            for citation in citations:
                if citation.get('id') not in valid_citations:
                    raise ValueError(f"Invalid citation: {citation.get('id')}. Must be one of: {valid_citations}")
                # Ensure page field is a string and properly formatted
                if 'page' in citation:
                    if not isinstance(citation['page'], str):
                        if isinstance(citation['page'], list):
                            citation['page'] = f"Page {', '.join(map(str, citation['page']))}"
                        else:
                            citation['page'] = "Page 1"  # Default if not string or list
                    elif not citation['page'].startswith('Page '):
                        citation['page'] = f"Page {citation['page']}"
                else:
                    citation['page'] = "Page 1"  # Default if missing
        return citations

def format_page_string(pages) -> str:
    """Helper function to format page numbers consistently"""
    if not pages:
        return "Page 1"
    if isinstance(pages, str):
        if pages.startswith('Page '):
            return pages
        return f"Page {pages}"
    if isinstance(pages, list):
        return f"Page {', '.join(map(str, pages))}"
    return "Page 1"

def generate_answer(question: str, paragraphs: List[Dict]) -> Answer:
    """Generate an answer using the AI model."""
    try:
        # Extract page numbers from paragraphs
        citations = []
        for p in paragraphs:
            if isinstance(p, dict) and 'pages' in p:
                for page in p['pages']:
                    citations.append({
                        "page": page,
                        "text": p.get('text', '')[:100] + '...'  # Truncate long text
                    })
        
        # Create the prompt
        prompt = f"""Question: {question}

Context:
{json.dumps(paragraphs, indent=2)}

Instructions:
1. Answer the question based ONLY on the provided context
2. If the context doesn't contain enough information, say so
3. Include page numbers in your citations
4. Be concise but complete
5. Use markdown formatting for better readability

Answer:"""

        # Generate the answer
        response = client_mini.chat.completions.create(
            model=deployment_mini,
            messages=[
                {"role": "system", "content": "You are a helpful AI assistant that answers questions based on provided context."},
                {"role": "user", "content": prompt}
            ],
            temperature=0.3,
            max_tokens=1000
        )
        
        answer = response.choices[0].message.content.strip()
        
        # Calculate costs
        input_tokens = response.usage.prompt_tokens
        output_tokens = response.usage.completion_tokens
        total_tokens = response.usage.total_tokens
        
        # Calculate costs based on model pricing
        input_cost = (input_tokens / 1_000_000) * 0.40  # $0.40 per million tokens
        output_cost = (output_tokens / 1_000_000) * 1.60  # $1.60 per million tokens
        total_cost = input_cost + output_cost
        
        return Answer(
            answer=answer,
            citations=citations,
            usage={
                "total_tokens": total_tokens,
                "prompt_tokens": input_tokens,
                "completion_tokens": output_tokens
            },
            costs={
                "input_cost": input_cost,
                "output_cost": output_cost,
                "total_cost": total_cost
            }
        )
    except Exception as e:
        print(f"Error generating answer: {e}")
        return Answer(
            answer="I apologize, but I encountered an error while processing your question. Please try again.",
            citations=[],
            usage={
                "total_tokens": 0,
                "prompt_tokens": 0,
                "completion_tokens": 0
            },
            costs={
                "input_cost": 0,
                "output_cost": 0,
                "total_cost": 0
            }
        )

