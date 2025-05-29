from fastapi import APIRouter, HTTPException, Depends, Query
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

# Create router with explicit prefix
router = APIRouter(prefix="/api", tags=["api"])
logger = get_logger(__name__)

# Initialize services
settings = Settings()
ai_service = AIService()

class QueryRequest(BaseModel):
    query: str
    category: str
    pdf_name: Optional[str] = None

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
        
        if not query or not category:
            raise HTTPException(status_code=400, detail="Query and category are required")
        
        # Get PDF content for the category
        pdf_content = pdf_manager.get_category_content(category)
        if not pdf_content:
            raise HTTPException(status_code=404, detail=f"No content found for category: {category}")
        
        # Process the query using the AI service
        result = ai_service.process_query(query, pdf_content)
        
        if not result:
            return {
                "answer": "Could not generate an answer due to missing context from selected paragraphs.",
                "reasoning": "",
                "relevant_paragraphs": [],
                "cost": 0.0
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
    """Get AI credentials and connectivity status."""
    try:
        status = ai_credentials_checker.check_all_credentials()
        return status
    except Exception as e:
        logger.error(f"Error checking AI status: {str(e)}")
        logger.exception("Full traceback:")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/pricing")
def get_pricing():
    with open("config/config.json") as f:
        return json.load(f)["MODEL_PRICING"] 