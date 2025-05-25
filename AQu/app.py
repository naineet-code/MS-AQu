from flask import Flask, render_template, request, jsonify, send_from_directory
from new_search import (
    navigate_to_paragraphs,
    generate_answer,
    split_into_50_chunks,
    route_chunks
)
import os
from dotenv import load_dotenv
import time
from pypdf import PdfReader
from openai import OpenAI
import re
import threading
import json

app = Flask(__name__, template_folder='templates', static_folder='static', static_url_path='')
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
    return render_template('index.html', pdfs=get_available_pdfs())

@app.route('/api/ask', methods=['POST'])
def ask_question():
    if not document_chunks:
        return jsonify({'error': 'No document loaded'}), 400

    question = request.json.get('question')
    if not question:
        return jsonify({'error': 'No question provided'}), 400

    try:
        # Get relevant paragraphs and scratchpad
        result = navigate_to_paragraphs(document_text, question, max_depth=1, chunks=document_chunks)
        relevant_paragraphs = result["paragraphs"]
        scratchpad = result["scratchpad"]
        
        # Generate answer
        answer = generate_answer(question, relevant_paragraphs, scratchpad)
        
        # Format the response
        response_data = {
            'answer': answer.answer if hasattr(answer, 'answer') else answer.get('answer', ''),
            'citations': [],
            'relevant_paragraphs': [],
            'reasoning': scratchpad
        }
        
        # Format citations and relevant paragraphs
        for paragraph in relevant_paragraphs:
            # Add citation if pages are available
            if 'pages' in paragraph and paragraph['pages']:
                page_numbers = sorted(paragraph['pages'])
                response_data['citations'].append({
                    'section': f'Section {paragraph.get("id", "Unknown")}',
                    'text': f'Page {", ".join(map(str, page_numbers))}',
                    'page': ', '.join(map(str, page_numbers))
                })
            
            # Add relevant paragraph with text and pages
            if 'text' in paragraph:
                response_data['relevant_paragraphs'].append({
                    'id': paragraph.get('id', 'Unknown'),
                    'text': paragraph['text'],
                    'pages': f'Page {", ".join(map(str, sorted(paragraph.get("pages", []))))}'
                })

        # Add citations from the answer object
        if hasattr(answer, 'citations'):
            for citation in answer.citations:
                if isinstance(citation, dict) and 'text' in citation:
                    response_data['citations'].append({
                        'section': citation.get('section', 'Unknown'),
                        'text': citation['text'],
                        'page': citation.get('page', '')
                    })

        return jsonify(response_data)
    except Exception as e:
        print(f"Error processing question: {str(e)}")
        return jsonify({'error': 'Failed to process question'}), 500

@app.route('/api/loading-status')
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

@app.route('/api/available-pdfs')
def available_pdfs():
    return jsonify(get_available_pdfs())

@app.route('/api/change-pdf', methods=['POST'])
def change_pdf():
    pdf_name = request.json.get('pdf_name')
    if not pdf_name:
        return jsonify({'error': 'No PDF name provided'}), 400
        
    # Start initialization in a new thread
    init_thread = threading.Thread(target=initialize_document, args=(pdf_name,))
    init_thread.start()
    
    return jsonify({'message': 'PDF change initiated'})

@app.route('/pdf/<path:filename>')
def serve_pdf(filename):
    try:
        return send_from_directory('pdf', filename, mimetype='application/pdf')
    except Exception as e:
        print(f"Error serving PDF: {str(e)}")
        return jsonify({'error': 'Failed to serve PDF'}), 404

# Initialize the document on startup
initialize_document()

if __name__ == '__main__':
    app.run(debug=True, port=6001) 