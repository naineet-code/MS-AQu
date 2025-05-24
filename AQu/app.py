from flask import Flask, render_template, request, jsonify, send_from_directory
from new_search import (
    navigate_to_paragraphs,
    generate_answer,
    split_into_50_chunks,
    route_chunks,
    LegalAnswer
)
import os
import re
from dotenv import load_dotenv
import threading
import time
from pypdf import PdfReader
from openai import OpenAI

# For logging interactions
import json

app = Flask(__name__)
load_dotenv()

@app.after_request
def add_cors_headers(response):
    # Allow CORS for all domains (for development)
    response.headers.add('Access-Control-Allow-Origin', '*')
    response.headers.add('Access-Control-Allow-Headers', 'Content-Type')
    response.headers.add('Access-Control-Allow-Methods', 'GET,POST,OPTIONS')
    return response

# Initialize OpenAI client
client = OpenAI()

# Global variables for caching
document_text = None
document_chunks = None
pdf_pages = []
is_loading = True
loading_progress = 0
current_pdf = None

def get_available_pdfs():
    """Get list of available PDF files in the pdf directory."""
    pdf_dir = 'pdf'
    if not os.path.exists(pdf_dir):
        os.makedirs(pdf_dir)
    return [f for f in os.listdir(pdf_dir) if f.lower().endswith('.pdf')]

def load_local_document(file_path: str) -> str:
    """Load a document from a local file path and return its text content with page numbers."""
    print(f"Loading document from {file_path}...")
    
    with open(file_path, 'rb') as file:
        pdf_reader = PdfReader(file)
        full_text = ""
        page_texts = []  # Store text for each page

        max_page = 920  # Page cutoff before section 1000 (Interferences)
        for i, page in enumerate(pdf_reader.pages):
            if i >= max_page:
                break
            page_text = page.extract_text()
            page_texts.append(page_text)
            full_text += page_text + "\n"

        # Count words and tokens
        word_count = len(full_text.split())
        print(f"Document loaded: {len(pdf_reader.pages)} pages, {word_count} words")
        return full_text, page_texts

def initialize_document(pdf_name=None):
    global document_text, document_chunks, is_loading, loading_progress, current_pdf, pdf_pages
    
    try:
        # Reset global variables
        document_text = None
        document_chunks = None
        is_loading = True
        loading_progress = 0
        
        # Use the provided PDF name, default to source.pdf if none provided
        if pdf_name is None:
            pdf_name = 'source.pdf'
        current_pdf = pdf_name
        loading_progress = 10
        pdf_path = os.path.join('pdf', pdf_name)
        if not os.path.exists(pdf_path):
            print(f"PDF {pdf_name} not found in pdf directory")
            is_loading = False
            return
        document_text, page_texts = load_local_document(pdf_path)
        # Cache page_texts for sample questions
        pdf_pages = page_texts
        loading_progress = 30
        
        # Create chunks with page information
        chunks = []
        current_chunk = {"text": "", "pages": set()}
        current_page = 0
        
        # Increase chunk size to reduce total number of chunks
        target_chunk_size = 1000  # Increased from 500 to 1000 words
        
        for page_num, page_text in enumerate(page_texts):
            # Split on sentence boundaries
            sentences = page_text.split('. ')
            for sentence in sentences:
                # Clean to only alphanumeric characters and spaces
                cleaned = re.sub(r'[^A-Za-z0-9 ]+', ' ', sentence)
                cleaned = re.sub(r'\s+', ' ', cleaned).strip()
                if cleaned:
                    current_chunk["text"] += cleaned + " "
                    current_chunk["pages"].add(page_num + 1)  # 1-based page numbers

                    # If chunk is large enough, save it and start a new one
                    if len(current_chunk["text"].split()) >= target_chunk_size:
                        chunks.append({
                            "id": len(chunks),
                            "text": current_chunk["text"].strip(),
                            "pages": sorted(list(current_chunk["pages"]))
                        })
                        current_chunk = {"text": "", "pages": set()}
                        loading_progress = 30 + (len(chunks) / 200 * 40)  # Progress from 30% to 70%
        
        # Add the last chunk if it has content
        if current_chunk["text"].strip():
            chunks.append({
                "id": len(chunks),
                "text": current_chunk["text"].strip(),
                "pages": sorted(list(current_chunk["pages"]))
            })
        
        document_chunks = chunks
        loading_progress = 100
        
        print(f"Created {len(chunks)} chunks from document {pdf_name}")
        # Small delay to ensure loading screen is visible
        time.sleep(1)
        is_loading = False
    except Exception as e:
        print(f"Error initializing document: {str(e)}")
        is_loading = False
        document_text = None
        document_chunks = None

@app.route('/')
def home():
    available_pdfs = get_available_pdfs()
    return render_template('index.html', pdfs=available_pdfs)

@app.route('/pdf/<path:filename>')
def serve_pdf(filename):
    return send_from_directory('pdf', filename)

@app.route('/loading-status')
def loading_status():
    status_info = {
        'is_loading': is_loading,
        'progress': loading_progress,
        'current_pdf': current_pdf,
        'status_message': ''
    }
    
    if is_loading:
        if loading_progress < 10:
            status_info['status_message'] = 'Starting initialization...'
        elif loading_progress < 30:
            status_info['status_message'] = 'Loading PDF document...'
        elif loading_progress < 70:
            status_info['status_message'] = f'Processing document into chunks... ({len(document_chunks) if document_chunks else 0} chunks created)'
        else:
            status_info['status_message'] = 'Finalizing document processing...'
    else:
        if document_chunks:
            status_info['status_message'] = f'Ready! Document processed into {len(document_chunks)} chunks'
        else:
            status_info['status_message'] = 'System ready'
            
    return jsonify(status_info)

@app.route('/available-pdfs')
def available_pdfs():
    return jsonify(get_available_pdfs())

@app.route('/change-pdf', methods=['POST'])
def change_pdf():
    pdf_name = request.json.get('pdf_name')
    if not pdf_name:
        return jsonify({'error': 'No PDF name provided'})
        
    # Start initialization in a new thread
    init_thread = threading.Thread(target=initialize_document, args=(pdf_name,))
    init_thread.start()
    
    return jsonify({'message': 'PDF change initiated'})
   
@app.route('/sample-questions')
def sample_questions():
    """Extract up to 5 sample questions (lines ending with '?') from the loaded PDF pages."""
    if not pdf_pages:
        return jsonify([])
    questions = []
    for page in pdf_pages:
        if not page:
            continue
        for line in page.splitlines():
            text = line.strip()
            if text.endswith('?'):
                questions.append(text)
        if len(questions) >= 5:
            break
    return jsonify(questions[:5])

@app.route('/search', methods=['POST'])
def search():
    if is_loading:
        return jsonify({
            'error': 'System is still initializing. Please wait.',
            'is_initializing': True,
            'status_message': 'System is still initializing. Please wait.'
        })
        
    question = request.json.get('question')
    pdf_name = request.json.get('pdf_name', 'source.pdf')  # Default to source.pdf
    
    if not question:
        return jsonify({
            'error': 'No question provided',
            'is_initializing': False,
            'status_message': 'Please enter a question'
        })
    
    # Check if we need to switch PDFs
    if current_pdf != pdf_name:
        print(f"Switching from {current_pdf} to {pdf_name}")
        initialize_document(pdf_name)
        # Wait for initialization to complete
        while is_loading:
            time.sleep(0.1)
        if not document_chunks:
            return jsonify({
                'error': f'Failed to load PDF {pdf_name}',
                'is_initializing': False,
                'status_message': f'Could not load PDF {pdf_name}'
            })
    
    # Sanitize question to only alphanumeric and spaces to avoid prompt errors
    question = re.sub(r'[^A-Za-z0-9 ]+', ' ', question).strip()
    # Sanitize question
    question = re.sub(r'[^A-Za-z0-9 ]+', ' ', question).strip()
    try:
        # First, route the chunks to find relevant ones
        routing_result = route_chunks(
            question=question,
            chunks=document_chunks,
            depth=0,
            scratchpad=""
        )
        
        # Get selected chunks
        selected_ids = routing_result["selected_ids"]
        print(f"Selected IDs from routing: {selected_ids}")
        
        # If no chunks were selected but we have reasoning, try to extract chunk numbers from the reasoning
        if not selected_ids and routing_result.get('scratchpad'):
            # Try to find chunk numbers mentioned in the reasoning
            chunk_matches = re.findall(r'Chunk[s]?\s+(\d+)', routing_result['scratchpad'])
            if chunk_matches:
                selected_ids = [int(id) for id in chunk_matches]
                print(f"Extracted chunk IDs from reasoning: {selected_ids}")
        
        selected_chunks = [c for c in document_chunks if c["id"] in selected_ids]
        
        print(f"Found {len(selected_chunks)} relevant chunks")
        for chunk in selected_chunks:
            print(f"Chunk {chunk['id']}: {chunk['text'][:100]}... (Pages: {chunk['pages']})")
        
        if not selected_chunks:
            resp = {
                'error': None,
                'reasoning': routing_result.get('scratchpad', ''),
                'relevant_paragraphs': [],
                'answer': None,
                'citations': [],
                'pdf_url': f'/pdf/{current_pdf}',
                'is_initializing': False,
                'status_message': f'Analyzed {len(document_chunks)} chunks, but found no relevant information'
            }
            # Log interaction
            try:
                with open('logs.jsonl', 'a') as logf:
                    entry = {'timestamp': time.time(), 'question': question, 'response': resp}
                    logf.write(json.dumps(entry) + '\n')
            except Exception:
                pass
            return jsonify(resp)
        
        # Generate the answer using the selected chunks
        try:
            answer_result = generate_answer(
                question=question,
                paragraphs=selected_chunks,
                scratchpad=routing_result['scratchpad']
            )
            
            if not answer_result or not answer_result.answer:
                resp = {
                    'error': None,
                    'reasoning': routing_result['scratchpad'],
                    'relevant_paragraphs': [{
                        'text': p['text'],
                        'id': str(p['id']),
                        'pages': f"Pages {min(p['pages'])}-{max(p['pages'])}" if len(p['pages']) > 1 else f"Page {p['pages'][0]}"
                    } for p in selected_chunks],
                    'answer': None,
                    'citations': [],
                    'pdf_url': f'/pdf/{current_pdf}',
                    'is_initializing': False,
                    'status_message': f'Analyzed {len(document_chunks)} chunks, found {len(selected_chunks)} relevant sections, but could not generate answer'
                }
                # Log interaction
                try:
                    with open('logs.jsonl', 'a') as logf:
                        entry = {'timestamp': time.time(), 'question': question, 'response': resp}
                        logf.write(json.dumps(entry) + '\n')
                except Exception:
                    pass
                return jsonify(resp)
                
            # Format paragraphs with their IDs and page numbers
            formatted_paragraphs = []
            for p in selected_chunks:
                page_range = f"Pages {min(p['pages'])}-{max(p['pages'])}" if len(p['pages']) > 1 else f"Page {p['pages'][0]}"
                formatted_paragraphs.append({
                    'text': p['text'],
                    'id': str(p['id']),
                    'pages': page_range
                })
            resp = {
                'reasoning': routing_result['scratchpad'],
                'relevant_paragraphs': formatted_paragraphs,
                'answer': answer_result.answer,
                'citations': answer_result.citations,
                'pdf_url': f'/pdf/{current_pdf}',
                'is_initializing': False,
                'status_message': f'Analyzed {len(document_chunks)} chunks, found {len(selected_chunks)} relevant sections, and generated answer'
            }
            # Log interaction
            try:
                with open('logs.jsonl', 'a') as logf:
                    entry = {'timestamp': time.time(), 'question': question, 'response': resp}
                    logf.write(json.dumps(entry) + '\n')
            except Exception:
                pass
            return jsonify(resp)
        except Exception as e:
            print(f"Error generating answer: {str(e)}")
            # If answer generation fails, return the chunks and reasoning
            return jsonify({
                'error': 'Could not generate answer, but found relevant information.',
                'reasoning': routing_result['scratchpad'],
                'relevant_paragraphs': [{
                    'text': p['text'],
                    'id': str(p['id']),
                    'pages': f"Pages {min(p['pages'])}-{max(p['pages'])}" if len(p['pages']) > 1 else f"Page {p['pages'][0]}"
                } for p in selected_chunks],
                'pdf_url': f'/pdf/{current_pdf}',
                'is_initializing': False,
                'status_message': f'Analyzed {len(document_chunks)} chunks, found {len(selected_chunks)} relevant sections, but could not generate answer'
            })
            
    except Exception as e:
        print(f"Error processing question: {str(e)}")
        resp = {
            'error': str(e),
            'reasoning': None,
            'relevant_paragraphs': [],
            'answer': None,
            'citations': [],
            'pdf_url': f'/pdf/{current_pdf}',
            'is_initializing': False,
            'status_message': f'Error analyzing chunks: {str(e)}'
        }
        # Log interaction error
        try:
            with open('logs.jsonl', 'a') as logf:
                entry = {'timestamp': time.time(), 'question': question, 'response': resp}
                logf.write(json.dumps(entry) + '\n')
        except Exception:
            pass
        return jsonify(resp)

if __name__ == '__main__':
    # Start document initialization in a separate thread
    init_thread = threading.Thread(target=initialize_document)
    init_thread.start()
    
    # Run the Flask app
    app.run(host='0.0.0.0', port=6001, debug=False)
    print("Server running on http://localhost:6001") 