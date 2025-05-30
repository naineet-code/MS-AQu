from fastapi import APIRouter, HTTPException, Depends, Query
from fastapi.responses import StreamingResponse, FileResponse
from typing import Dict, List, Optional
from pydantic import BaseModel
from core.ai_service import AIService
from config.settings import Settings
from config.logging_config import get_logger
from core.instances import pdf_manager  # Import shared instance
from pathlib import Path
from openai import AzureOpenAI
import tiktoken
from nltk.tokenize import sent_tokenize
import json
from core.ai_credentials_check import ai_credentials_checker
from core.cache_manager import RedisCacheManager
import time
import csv
import io
import datetime

# Create router with explicit prefix
router = APIRouter(prefix="/api", tags=["api"])
logger = get_logger(__name__)

# Initialize services
settings = Settings()
ai_service = AIService()
cache_manager = RedisCacheManager()

class QueryRequest(BaseModel):
    query: str
    category: str
    pdf_name: Optional[str] = None
    force_no_cache: Optional[bool] = False

class AnalysisRequest(BaseModel):
    text: str
    analysis_type: str

class RouteRequest(BaseModel):
    question: str
    paragraphs: list  # Expecting a list of dicts, e.g., [{"id": "...", "sentences": "..."}]

class AnswerRequest(BaseModel):
    question: str
    selected_paragraphs: list  # Expecting a list of dicts like {"id": "...", "sentences": "..."}

class VerifyRequest(BaseModel):
    question: str
    answer: str
    context_paragraphs: list  # Expecting a list of dicts like {"id": "...", "sentences": "..."}

class RouteResponse(BaseModel):
    selected_ids: list[str]  # Assuming this is a list of paragraph IDs

class AnswerResponse(BaseModel):
    answer: str
    source_paragraph_ids: list[str] = []  # Added

class VerifyResponse(BaseModel):
    verification: dict  # Or a more specific Pydantic model
    source_paragraph_ids: list[str] = []  # Added

def get_pdf_path(category: str) -> Optional[str]:
    """Get the path to the PDF file for a given category."""
    pdf_dir = Path("static/pdfs")
    category_dir = pdf_dir / category
    
    if not category_dir.exists():
        logger.warning(f"Category directory not found: {category_dir}")
        return None
    
    # Look for PDF files in the category directory
    pdf_files = list(category_dir.glob("*.pdf"))
    if not pdf_files:
        logger.warning(f"No PDF files found in {category_dir}")
        return None
    
    # Return the first PDF file found
    return str(pdf_files[0])

@router.get("/load-pdf/{category}")
async def load_pdf(category: str):
    """Load a PDF file for a specific category."""
    try:
        # Get the PDF directory path
        pdf_dir = Path("static/pdfs")
        category_dir = pdf_dir / category
        
        logger.info(f"Looking for PDFs in directory: {category_dir}")
        
        if not category_dir.exists():
            logger.error(f"Category directory not found: {category_dir}")
            raise HTTPException(
                status_code=404,
                detail=f"Category directory not found: {category}"
            )
        
        # Look for PDF files in the category directory
        pdf_files = list(category_dir.glob("*.pdf"))
        if not pdf_files:
            logger.error(f"No PDF files found in {category_dir}")
            raise HTTPException(
                status_code=404,
                detail=f"No PDF files found for category: {category}"
            )
        
        # Load the first PDF file found
        pdf_path = str(pdf_files[0])
        logger.info(f"Loading PDF from path: {pdf_path}")
        
        # Load the PDF into the manager
        pdf_manager._load_pdf(Path(pdf_path), category)
        
        # Get paragraphs from the loaded PDF
        paragraphs = pdf_manager.get_category_content(category)
        
        return {
            "status": "success",
            "message": f"Successfully loaded PDF for {category}",
            "paragraphs": paragraphs,
            "pdf_name": pdf_files[0].name
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error loading PDF: {str(e)}")
        logger.exception("Full traceback:")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/route", response_model=RouteResponse)
def route(request: RouteRequest):
    """Route a question to relevant paragraphs."""
    try:
        # Process the question and paragraphs
        selected_ids = ai_service.route_question(request.question, request.paragraphs)
        return RouteResponse(selected_ids=selected_ids)
    except Exception as e:
        logger.error(f"Error in route: {str(e)}")
        logger.exception("Full traceback:")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/generate-answer", response_model=AnswerResponse)
def generate_answer(request: AnswerRequest):
    """Generate an answer based on selected paragraphs."""
    try:
        if not request.selected_paragraphs:
            logger.warning("generate_answer called with no context from selected paragraphs.")
            return AnswerResponse(
                answer="Could not generate an answer due to missing context from selected paragraphs.",
                source_paragraph_ids=[]
            )
        
        # Generate answer using the AI service
        answer = ai_service.generate_answer(request.question, request.selected_paragraphs)
        return AnswerResponse(
            answer=answer,
            source_paragraph_ids=[p.get("id") for p in request.selected_paragraphs]
        )
    except Exception as e:
        logger.error(f"Error in generate_answer: {str(e)}")
        logger.exception("Full traceback:")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/verify", response_model=VerifyResponse)
def verify(request: VerifyRequest):
    """Verify an answer against context paragraphs."""
    try:
        if not request.context_paragraphs:
            logger.warning("verify called with no context.")
            return VerifyResponse(
                verification={"is_correct": False, "reason": "No context provided"},
                source_paragraph_ids=[]
            )
        
        # Verify the answer using the AI service
        verification = ai_service.verify_answer(
            request.question,
            request.answer,
            request.context_paragraphs
        )
        return VerifyResponse(
            verification=verification,
            source_paragraph_ids=[p.get("id") for p in request.context_paragraphs]
        )
    except Exception as e:
        logger.error(f"Error in verify: {str(e)}")
        logger.exception("Full traceback:")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/query")
async def unified_rag(request: dict):
    """Unified RAG endpoint that handles the entire process."""
    try:
        query = request.get("query")
        category = request.get("category")
        force_no_cache = request.get("force_no_cache", False)
        
        if not query or not category:
            raise HTTPException(status_code=400, detail="Query and category are required")
        
        # Get PDF content for the category
        pdf_content = pdf_manager.get_category_content(category)
        if not pdf_content:
            raise HTTPException(status_code=404, detail=f"No content found for category: {category}")
        
        # Process the query using the AI service
        result = ai_service.process_query(query, pdf_content, category, force_no_cache)
        
        if not result:
            return {
                "answer": "Could not generate an answer due to missing context from selected paragraphs.",
                "reasoning": "",
                "relevant_paragraphs": [],
                "cost": 0.0,
                "cache_hit": False,
                "forced_no_cache": force_no_cache
            }
        
        return result
    except Exception as e:
        logger.error(f"Error in unified_rag: {str(e)}")
        logger.exception("Full traceback:")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/analyze")
async def analyze_text(request: AnalysisRequest) -> Dict:
    """Analyze text using AI."""
    try:
        response = await ai_service.analyze_text(
            text=request.text,
            analysis_type=request.analysis_type,
            model=settings.get("MODEL_NAME")
        )
        return response
    except Exception as e:
        logger.error(f"Error analyzing text: {str(e)}")
        logger.exception("Full traceback:")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/pdfs")
async def list_pdfs(category: Optional[str] = None) -> Dict[str, List[str]]:
    """List available PDFs."""
    try:
        if category:
            pdfs = pdf_manager.get_pdf_by_category(category)
            return {"pdfs": list(pdfs.keys())}
        else:
            return {"pdfs": list(pdf_manager.pdf_cache.keys())}
    except Exception as e:
        logger.error(f"Error listing PDFs: {str(e)}")
        logger.exception("Full traceback:")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/refresh-pdfs")
async def refresh_pdfs() -> Dict:
    """Refresh PDF cache."""
    try:
        pdf_manager.refresh_all()
        return {"message": "PDF cache refreshed successfully"}
    except Exception as e:
        logger.error(f"Error refreshing PDFs: {str(e)}")
        logger.exception("Full traceback:")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/ai-status")
async def get_ai_status() -> Dict:
    """Get AI credentials, connectivity status, and cache statistics."""
    try:
        # Get AI credentials status
        ai_status = ai_credentials_checker.check_all_credentials()
        
        # Get cache statistics
        cache_stats = cache_manager.get_cache_stats()
        
        # Get Redis connection status
        redis_status = {
            "connected": cache_manager.redis_client is not None,
            "host": settings.get("REDIS_HOST", "localhost"),
            "port": settings.get("REDIS_PORT", 6379),
            "db": settings.get("REDIS_DB", 0),
            "cache_ttl": settings.get("CACHE_TTL", 3600),
            "similarity_threshold": settings.get("CACHE_SIMILARITY_THRESHOLD", 0.85)
        }
        
        # Combine all status information
        status = {
            "ai_credentials": ai_status,
            "cache": {
                "status": cache_stats,
                "redis": redis_status,
                "features": {
                    "semantic_caching": True,
                    "answer_verification": True,
                    "cache_ttl_enabled": True,
                    "similarity_threshold": settings.get("CACHE_SIMILARITY_THRESHOLD", 0.85)
                }
            },
            "timestamp": time.time()
        }
        
        return status
    except Exception as e:
        logger.error(f"Error checking AI status: {str(e)}")
        logger.exception("Full traceback:")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/pricing")
def get_pricing():
    with open("config/config.json") as f:
        return json.load(f)["MODEL_PRICING"]

@router.get("/download-question-logs")
async def download_question_logs():
    """Download question logs and cache entries as a CSV file."""
    try:
        output = io.StringIO()
        writer = csv.writer(output)
        
        # Write headers
        writer.writerow([
            "Timestamp", "Question", "Category", "Cache Hit", "Response Time (ms)", 
            "Total Cost", "Answer Summary", "Reasoning Summary", "Similarity Score", 
            "Confidence Score", "Forced No Cache"
        ])
        
        # Read question logs from file
        try:
            with open("question_log.jsonl", "r") as f:
                for line in f:
                    if line.strip():
                        try:
                            log_entry = json.loads(line.strip())
                            writer.writerow([
                                log_entry.get("timestamp", ""),
                                log_entry.get("question", ""),
                                log_entry.get("category", ""),
                                log_entry.get("cache_hit", False),
                                log_entry.get("response_time_ms", 0),
                                log_entry.get("cost", 0),
                                log_entry.get("answer_summary", "")[:200] + "..." if len(log_entry.get("answer_summary", "")) > 200 else log_entry.get("answer_summary", ""),
                                log_entry.get("reasoning_summary", "")[:200] + "..." if len(log_entry.get("reasoning_summary", "")) > 200 else log_entry.get("reasoning_summary", ""),
                                log_entry.get("similarity_score", ""),
                                log_entry.get("confidence_score", ""),
                                log_entry.get("forced_no_cache", False)
                            ])
                        except json.JSONDecodeError:
                            continue
        except FileNotFoundError:
            logger.warning("Question log file not found")
        
        # Add cache entries section
        writer.writerow([])  # Empty row for separation
        writer.writerow(["=== CACHE ENTRIES ==="])
        writer.writerow([
            "Cache Key", "Original Query", "Cached At", "Answer Preview", 
            "Embedding Cost", "TTL (seconds)"
        ])
        
        cache_entries = cache_manager.get_cache_entries_for_export()
        for entry in cache_entries:
            cached_at_formatted = datetime.datetime.fromtimestamp(entry.get('cached_at', 0)).isoformat() if entry.get('cached_at') else ""
            writer.writerow([
                entry.get('cache_key', ''),
                entry.get('original_query', ''),
                cached_at_formatted,
                entry.get('answer_preview', ''),
                entry.get('embedding_cost', 0),
                entry.get('ttl', 0)
            ])
        
        output.seek(0)
        csv_content = output.getvalue()
        output.close()
        
        # Create filename with timestamp
        timestamp = datetime.datetime.now().strftime("%Y%m%d_%H%M%S")
        filename = f"aqu_logs_and_cache_{timestamp}.csv"
        
        return StreamingResponse(
            io.BytesIO(csv_content.encode('utf-8')),
            media_type="text/csv",
            headers={"Content-Disposition": f"attachment; filename={filename}"}
        )
        
    except Exception as e:
        logger.error(f"Error downloading question logs: {str(e)}")
        logger.exception("Full traceback:")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/clear-cache")
async def clear_cache():
    """Clear the Redis cache."""
    try:
        success = cache_manager.clear_cache()
        if success:
            return {"message": "Cache cleared successfully", "success": True}
        else:
            return {"message": "Failed to clear cache", "success": False}
    except Exception as e:
        logger.error(f"Error clearing cache: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/get-knowledge-base-pdf")
async def get_knowledge_base_pdf():
    """Serve the first available PDF from the knowledge base."""
    try:
        # Get the first available PDF from any category
        if not pdf_manager.pdf_cache:
            logger.error("No PDFs available in cache")
            raise HTTPException(
                status_code=404, 
                detail="No PDF documents available in the knowledge base"
            )
        
        # Get the first PDF from the cache
        first_pdf_name = next(iter(pdf_manager.pdf_cache.keys()))
        pdf_info = pdf_manager.pdf_cache[first_pdf_name]
        pdf_path = Path(pdf_info['path'])
        
        if not pdf_path.exists():
            logger.error(f"PDF file not found: {pdf_path}")
            raise HTTPException(status_code=404, detail="PDF file not found")
        
        logger.info(f"Serving PDF inline: {pdf_path}")
        return FileResponse(
            path=str(pdf_path),
            media_type="application/pdf",
            headers={
                "Content-Disposition": "inline",
                "Content-Transfer-Encoding": "binary",
                "Accept-Ranges": "bytes",
                "Cache-Control": "public, max-age=3600",
                "X-Content-Type-Options": "nosniff"
            }
        )
    except Exception as e:
        logger.error(f"Error serving knowledge base PDF: {str(e)}")
        logger.exception("Full traceback:")
        raise HTTPException(status_code=500, detail=str(e)) 