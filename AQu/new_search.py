# %pip install tiktoken pypdf nltk openai pydantic --quiet

import requests
from io import BytesIO
from pypdf import PdfReader
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
    nltk.data.find('tokenizers/punkt')
except LookupError:
    nltk.download('punkt', quiet=True)

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
    """
    # First, split the text into sentences
    sentences = sent_tokenize(text)

    # Get tokenizer for counting tokens
    tokenizer = tiktoken.get_encoding(TOKENIZER_NAME)

    # Create chunks that respect sentence boundaries and minimum token count
    chunks = []
    current_chunk_sentences = []
    current_chunk_tokens = 0

    for sentence in sentences:
        # Count tokens in this sentence
        sentence_tokens = len(tokenizer.encode(sentence))

        # If adding this sentence would make the chunk too large AND we already have the minimum tokens,
        # finalize the current chunk and start a new one
        if (current_chunk_tokens + sentence_tokens > min_tokens * 2) and current_chunk_tokens >= min_tokens:
            chunk_text = " ".join(current_chunk_sentences)
            chunks.append({
                "id": len(chunks),  # Integer ID instead of string
                "text": chunk_text
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
            "text": chunk_text
        })

    # If we have more than 30 chunks, consolidate them
    if len(chunks) > 30:
        # Recombine all text
        all_text = " ".join(chunk["text"] for chunk in chunks)
        # Re-split into exactly 30 chunks, without minimum token requirement
        sentences = sent_tokenize(all_text)
        sentences_per_chunk = len(sentences) // 30 + (1 if len(sentences) % 30 > 0 else 0)

        chunks = []
        for i in range(0, len(sentences), sentences_per_chunk):
            # Get the sentences for this chunk
            chunk_sentences = sentences[i:i+sentences_per_chunk]
            # Join the sentences into a single text
            chunk_text = " ".join(chunk_sentences)
            # Create a chunk object with ID and text
            chunks.append({
                "id": len(chunks),  # Integer ID instead of string
                "text": chunk_text
            })

    # Print chunk statistics
    print(f"Split document into {len(chunks)} chunks")
    for i, chunk in enumerate(chunks):
        token_count = len(tokenizer.encode(chunk["text"]))
        print(f"Chunk {i}: {token_count} tokens")

    return chunks

from openai import OpenAI

# Initialize OpenAI client
client = OpenAI()  # Will use OPENAI_API_KEY from environment variables

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
        
        response = client.chat.completions.create(
            model="gpt-4.1",
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
    
    # Create a prompt for the batch
    batch_prompt = create_routing_prompt(question, batch_chunks, 0, "")
    
    # Get routing decision
    routing_decision = get_routing_decision(batch_prompt)
    
    batch_time = time.time() - batch_start_time
    print(f"Batch {batch_num} completed in {batch_time:.2f} seconds")
    
    return routing_decision

def route_chunks(question: str, chunks: List[Dict], depth: int = 0, scratchpad: str = "") -> Dict:
    """Route chunks to find the most relevant ones for the question."""
    print(f"\n==== ROUTING AT DEPTH {depth} ====")
    
    start_time = time.time()
    timeout = 15  # Reduced from 20 to 15 seconds
    max_chunks_per_batch = 20  # Reduced from 30 to 20 chunks per batch
    min_chunks_to_find = 3  # Stop if we find this many relevant chunks
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
    
    # Process batches in parallel
    all_selected_ids = set()
    all_scratchpad = []
    
    with concurrent.futures.ThreadPoolExecutor(max_workers=3) as executor:
        future_to_batch = {executor.submit(process_batch, batch): batch for batch in batches}
        
        for future in concurrent.futures.as_completed(future_to_batch):
            if time.time() - start_time > timeout:
                print(f"Routing timeout reached after {time.time() - start_time:.2f} seconds")
                break
                
            try:
                routing_decision = future.result()
                if routing_decision["selected_ids"]:
                    all_selected_ids.update(routing_decision["selected_ids"])
                    print(f"Selected {len(routing_decision['selected_ids'])} chunks in this batch")
                    if len(all_selected_ids) >= min_chunks_to_find:
                        print(f"Found sufficient chunks ({len(all_selected_ids)}), stopping early")
                        break
                if routing_decision["scratchpad"]:
                    all_scratchpad.append(routing_decision["scratchpad"])
            except Exception as e:
                print(f"Error processing batch: {e}")
    
    # Combine results
    result = {
        "selected_ids": list(all_selected_ids),
        "scratchpad": "\n".join(all_scratchpad) if all_scratchpad else ""
    }
    
    print(f"\nRouting completed in {time.time() - start_time:.2f} seconds")
    print(f"Total chunks selected: {len(result['selected_ids'])}")
    
    return result

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
    scratchpad = ""

    # Use provided chunks or create new ones
    if chunks is None:
        chunks = split_into_50_chunks(document_text, min_tokens=500)

    # Navigator state - track chunk paths to maintain hierarchy
    chunk_paths = {}  # Maps numeric IDs to path strings for display
    for chunk in chunks:
        chunk_paths[chunk["id"]] = str(chunk["id"])

    # Navigate through levels until max_depth or until no chunks remain
    for current_depth in range(max_depth + 1):
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

            # Update display IDs to show hierarchy
            for chunk in selected_chunks:
                chunk["display_id"] = chunk_paths[chunk["id"]]

            return {"paragraphs": selected_chunks, "scratchpad": scratchpad}

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
                chunk_paths[next_chunk_id] = path
                next_level_chunks.append(sub_chunk)
                next_chunk_id += 1

        # Update chunks for next iteration
        chunks = next_level_chunks

    # If we get here, return the last selected chunks
    return {"paragraphs": selected_chunks, "scratchpad": scratchpad}

from pydantic import BaseModel, field_validator

class LegalAnswer(BaseModel):
    """Structured response format for legal questions"""
    answer: str
    citations: List[str]

    @field_validator('citations')
    def validate_citations(cls, citations, info):
        # Access valid_citations from the model_config
        valid_citations = info.data.get('_valid_citations', [])
        if valid_citations:
            for citation in citations:
                if citation not in valid_citations:
                    raise ValueError(f"Invalid citation: {citation}. Must be one of: {valid_citations}")
        return citations

def generate_answer(question: str, paragraphs: List[Dict[str, Any]],
                   scratchpad: str) -> LegalAnswer:
    """Generate an answer from the retrieved paragraphs."""
    print("\n==== GENERATING ANSWER ====")

    # Extract valid citation IDs
    valid_citations = [str(p.get("display_id", str(p["id"]))) for p in paragraphs]

    if not paragraphs:
        return LegalAnswer(
            answer="I couldn't find relevant information to answer this question in the document.",
            citations=[],
            _valid_citations=[]
        )

    # Prepare context for the model
    context = ""
    for paragraph in paragraphs:
        display_id = paragraph.get("display_id", str(paragraph["id"]))
        context += f"PARAGRAPH {display_id}:\n{paragraph['text']}\n\n"

    system_prompt = """You are a Harry Potter expert answering questions about the
Harry Potter series.

Answer questions based ONLY on the provided paragraphs. Do not rely on any foundation knowledge or external information or extrapolate from the paragraphs.
Cite phrases of the paragraphs that are relevant to the answer. This will help you be more specific and accurate.
Include citations to paragraph IDs for every statement in your answer. Valid citation IDs are: {valid_citations_str}
Keep your answer clear, precise, and professional.

Your response must be in JSON format with the following structure:
{{
    "answer": "your detailed answer here",
    "citations": ["citation_id1", "citation_id2", ...]
}}
"""
    valid_citations_str = ", ".join(valid_citations)

    # Call the model using structured output
    response = client.chat.completions.create(
        model="gpt-4.1",
        messages=[
            {"role": "system", "content": system_prompt.format(valid_citations_str=valid_citations_str)},
            {"role": "user", "content": f"QUESTION: {question}\n\nSCRATCHPAD (Navigation reasoning):\n{scratchpad}\n\nPARAGRAPHS:\n{context}"}
        ],
        response_format={"type": "json_object"},
        temperature=0.3
    )

    # Parse the response into LegalAnswer format
    try:
        response_content = response.choices[0].message.content.strip()
        response_data = json.loads(response_content)
        answer = LegalAnswer(
            answer=response_data.get("answer", ""),
            citations=response_data.get("citations", []),
            _valid_citations=valid_citations
        )
    except (json.JSONDecodeError, ValueError) as e:
        print(f"Error parsing response: {e}")
        print(f"Response content: {repr(response.choices[0].message.content)}")
        
        # Try to repair the JSON here too
        response_content = response.choices[0].message.content.strip()
        
        try:
            # Basic repair attempt for generate_answer response
            fixed_content = response_content
            
            # Handle incomplete answer field
            if '"answer": "' in fixed_content and fixed_content.count('"answer": "') == 1:
                parts = fixed_content.split('"answer": "')
                if len(parts) == 2:
                    after_answer = parts[1]
                    # Find where answer string should end
                    if '", "citations"' not in after_answer and '",' not in after_answer:
                        # Answer string is incomplete
                        fixed_content = parts[0] + '"answer": "Response was truncated", "citations": []}'
            
            # Handle missing closing braces
            open_braces = fixed_content.count('{')
            close_braces = fixed_content.count('}')
            if open_braces > close_braces:
                fixed_content += '}' * (open_braces - close_braces)
            
            response_data = json.loads(fixed_content)
            print(f"Successfully repaired answer JSON")
            answer = LegalAnswer(
                answer=response_data.get("answer", "Response was truncated"),
                citations=response_data.get("citations", []),
                _valid_citations=valid_citations
            )
        except json.JSONDecodeError:
            print("Could not repair answer JSON, using fallback")
            answer = LegalAnswer(
                answer="Error generating answer due to JSON parsing issue. Please try again.",
                citations=[],
                _valid_citations=valid_citations
            )

    print(f"\nAnswer: {answer.answer}")
    print(f"Citations: {answer.citations}")

    return answer

