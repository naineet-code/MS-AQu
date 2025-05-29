# %pip install tiktoken pypdf nltk openai pydantic --quiet

import re
import tiktoken
from nltk.tokenize import sent_tokenize
import nltk
import ssl
from typing import List, Dict, Any, Tuple
import os
import time
import concurrent.futures
import json
from openai import AzureOpenAI
import requests
from io import BytesIO
import httpx

# Configuration is now loaded from TOML via credentials manager

# Import credentials manager
import sys
from pathlib import Path
sys.path.append(str(Path(__file__).parent))
from config.credentials import get_azure_config

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

def split_into_50_chunks(text: str, min_tokens: int = 500) -> List[Dict[str, Any]]:
    """
    Split text into chunks of approximately min_tokens size, preserving page boundaries.
    """
    try:
        # Initialize tokenizer
        tokenizer = tiktoken.get_encoding("cl100k_base")
        
        # Split text into sentences
        sentences = sent_tokenize(text)
        print(f"\nTotal sentences: {len(sentences)}")
        print("First few sentences:")
        for i, s in enumerate(sentences[:5]):
            print(f"Sentence {i}: {s[:100]}...")
        
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
                print(f"\nCreated chunk {len(chunks)-1}:")
                print(f"Pages: {current_page}")
                print(f"Content: {chunk_text[:200]}...")
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
            print(f"\nCreated final chunk {len(chunks)-1}:")
            print(f"Pages: {current_page}")
            print(f"Content: {chunk_text[:200]}...")

        return chunks
    except Exception as e:
        print(f"Error in split_into_50_chunks: {str(e)}")
        # Return a single chunk with the entire text if there's an error
        return [{"id": 0, "text": text, "pages": [1]}]

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
                {"role": "system", "content": "Select relevant chunks. Return JSON: {\"selected_ids\": [\"id1\", \"id2\"], \"scratchpad\": \"brief reason\"}"},
                {"role": "user", "content": prompt}
            ],
            response_format={"type": "json_object"},
            temperature=0.3,
            max_tokens=400  # Reduced from 800 since we need less detailed reasoning
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
    
    # Create a simplified prompt for the batch
    batch_prompt = f"""You are a routing system that finds relevant information in a document.
Identify which chunks are most relevant to answering this question:

QUESTION: {question}

Return a JSON object with:
1. "selected_ids": List of chunk IDs that contain relevant information
2. "scratchpad": Brief reason for selection

CHUNKS:
"""
    
    for chunk in batch_chunks:
        batch_prompt += f"\nChunk {chunk['id']}:\n{chunk['text']}\n"
    
    # Get routing decision
    routing_decision = get_routing_decision(batch_prompt)
    
    # Ensure scratchpad is not empty
    if not routing_decision.get("scratchpad"):
        routing_decision["scratchpad"] = f"Selected chunks {routing_decision['selected_ids']} as relevant to: {question}"
    
    batch_time = time.time() - batch_start_time
    print(f"Batch {batch_num} completed in {batch_time:.2f} seconds")
    
    return routing_decision

def route_chunks(question: str, chunks: List[Dict], depth: int = 0, scratchpad: str = "") -> Dict:
    """Route chunks to find the most relevant ones for the question."""
    print(f"\n==== ROUTING AT DEPTH {depth} ====")
    print(f"Question: {question}")
    print(f"Number of chunks to evaluate: {len(chunks)}")
    
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
        
        # Create simplified prompt for this batch
        prompt = f"""Question: {question}

Select relevant chunks that help answer the question.

Return JSON: {{"selected_ids": [chunk_ids], "reasoning": "brief reason"}}

Chunks:
{json.dumps(batch_chunks, indent=2)}"""

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

def navigate_to_paragraphs(question: str, chunks: List[Dict], depth: int = 0) -> List[Dict]:
    """Navigate through the document hierarchy to find relevant paragraphs."""
    print(f"\n==== NAVIGATING AT DEPTH {depth} ====")
    print(f"Question: {question}")
    print(f"Number of chunks provided: {len(chunks)}")
    
    # First, check if any chunks are from the first page
    first_page_chunks = []
    for chunk in chunks:
        if chunk.get('page_number') == 1:
            first_page_chunks.append(chunk)
    
    print(f"\nFirst page chunks found: {len(first_page_chunks)}")
    if first_page_chunks:
        print("Prioritizing first page chunks...")
        chunks = first_page_chunks
    
    # Get the most relevant chunks
    result = route_chunks(question, chunks, depth)
    selected_ids = result["selected_ids"]
    scratchpad = result["scratchpad"]
    
    print(f"\nSelected chunk IDs: {selected_ids}")
    print(f"Scratchpad: {scratchpad}")
    
    # If we found relevant chunks, return them
    if selected_ids:
        selected_chunks = [chunk for chunk in chunks if chunk["id"] in selected_ids]
        print(f"\nReturning {len(selected_chunks)} selected chunks")
        for chunk in selected_chunks:
            print(f"Chunk {chunk['id']} (Page {chunk.get('page_number', 'N/A')}): {chunk['text'][:100]}...")
        return selected_chunks
    
    # If we didn't find any chunks and we're at depth 0, try a more general search
    if depth == 0:
        print("\nNo chunks found at depth 0, trying more general search...")
        # Try with a more general prompt
        result = route_chunks(
            f"Find any information that might be related to: {question}",
            chunks,
            depth + 1,
            scratchpad
        )
        selected_ids = result["selected_ids"]
        if selected_ids:
            selected_chunks = [chunk for chunk in chunks if chunk["id"] in selected_ids]
            print(f"\nFound {len(selected_chunks)} chunks in general search")
            for chunk in selected_chunks:
                print(f"Chunk {chunk['id']} (Page {chunk.get('page_number', 'N/A')}): {chunk['text'][:100]}...")
            return selected_chunks
    
    print("\nNo relevant chunks found")
    return []

# Rest of the file with Answer class and generate_answer function
from pydantic import BaseModel, field_validator
from typing import Optional

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
        "total_cost": 0.0,
        "input_cost": 0.0,
        "output_cost": 0.0
    }
    
    @field_validator('citations')
    def validate_citations(cls, citations, info):
        # Access valid_citations from the model_config
        valid_citations = getattr(cls.model_config, 'valid_citations', [])
        
        # If no valid citations are provided, skip validation
        if not valid_citations:
            return citations
        
        # Validate each citation
        for citation in citations:
            if isinstance(citation, dict) and 'text' in citation:
                citation_text = citation['text']
                if not any(valid_citation in citation_text for valid_citation in valid_citations):
                    raise ValueError(f"Citation '{citation_text}' not found in source material")
            elif isinstance(citation, str):
                if not any(valid_citation in citation for valid_citation in valid_citations):
                    raise ValueError(f"Citation '{citation}' not found in source material")
        
        return citations

def format_page_string(pages) -> str:
    """Format page numbers for display."""
    if not pages:
        return "Unknown"
    if len(pages) == 1:
        return f"Page {pages[0]}"
    else:
        return f"Pages {'–'.join(map(str, sorted(set(pages))))}"

def generate_answer(question: str, paragraphs: List[Dict]) -> Answer:
    """
    Generate an answer using the main model based on selected paragraphs.
    
    Args:
        question: The user's question
        paragraphs: List of relevant paragraph dictionaries
        
    Returns:
        Answer object with structured response
    """
    try:
        # Get main client configuration
        config = get_azure_config('main')
        
        client_main = AzureOpenAI(
            api_key=config['api_key'],
            api_version=config['api_version'],
            azure_endpoint=config['endpoint'],
            http_client=httpx.Client()
        )
        deployment_main = config['deployment_name']
        
        print(f"Main client initialized successfully with deployment: {deployment_main}")
        
        # Prepare context from paragraphs
        context = ""
        for i, para in enumerate(paragraphs):
            page_info = format_page_string(para.get('pages', [1]))
            context += f"\n[Source {i+1} - {page_info}]\n{para['text']}\n"
        
        # Create the prompt
        prompt = f"""Based on the following context, please answer the question. Provide a comprehensive answer with specific citations.

Context:
{context}

Question: {question}

Please provide:
1. A detailed answer to the question
2. Specific citations from the context (include the source number and page)
3. If the information is not available in the context, clearly state that

Answer:"""

        # Call the main model
        start_time = time.time()
        response = client_main.chat.completions.create(
            model=deployment_main,
            messages=[
                {"role": "system", "content": "You are a helpful AI assistant that provides detailed answers with accurate citations."},
                {"role": "user", "content": prompt}
            ],
            temperature=0.3,
            max_tokens=1500
        )
        
        api_time = time.time() - start_time
        print(f"Main model API call took {api_time:.2f} seconds")
        
        # Extract the answer
        answer_text = response.choices[0].message.content.strip()
        
        # Create citations from the paragraphs
        citations = []
        for i, para in enumerate(paragraphs):
            page_info = format_page_string(para.get('pages', [1]))
            citations.append({
                "text": para['text'][:200] + "..." if len(para['text']) > 200 else para['text'],
                "page": page_info,
                "source": f"Source {i+1}"
            })
        
        # Calculate usage and cost (simplified)
        usage = {
            "total_tokens": response.usage.total_tokens,
            "prompt_tokens": response.usage.prompt_tokens,
            "completion_tokens": response.usage.completion_tokens
        }
        
        # Simplified cost calculation (you may want to adjust these rates)
        input_cost = usage["prompt_tokens"] * 0.00001  # $0.01 per 1K tokens
        output_cost = usage["completion_tokens"] * 0.00003  # $0.03 per 1K tokens
        total_cost = input_cost + output_cost
        
        cost = {
            "total_cost": total_cost,
            "input_cost": input_cost,
            "output_cost": output_cost
        }
        
        return Answer(
            answer=answer_text,
            citations=citations,
            usage=usage,
            cost=cost
        )
        
    except Exception as e:
        print(f"Error generating answer: {str(e)}")
        return Answer(
            answer=f"I apologize, but I encountered an error while generating the answer: {str(e)}",
            citations=[],
            usage={"total_tokens": 0, "prompt_tokens": 0, "completion_tokens": 0},
            cost={"total_cost": 0.0, "input_cost": 0.0, "output_cost": 0.0}
        ) 