from fastapi import APIRouter, HTTPException, Depends
from typing import Dict, List, Optional
from pydantic import BaseModel
from core.pdf_manager import PDFManager
from core.ai_service import AIService
from config.settings import Settings
from config.logging_config import get_logger

router = APIRouter()
logger = get_logger(__name__)

# Initialize services
settings = Settings()
pdf_manager = PDFManager(settings.get("PDF_DIR"))
pdf_manager.load_pdfs()
ai_service = AIService()

class QueryRequest(BaseModel):
    query: str
    category: str
    pdf_name: Optional[str] = None

class AnalysisRequest(BaseModel):
    text: str
    analysis_type: str

@router.post("/query")
async def process_query(request: QueryRequest) -> Dict:
    """Process a query against PDF content."""
    try:
        # Get relevant PDF
        if request.pdf_name:
            pdf_info = pdf_manager.get_pdf(request.pdf_name)
            if not pdf_info:
                raise HTTPException(status_code=404, detail=f"PDF {request.pdf_name} not found")
        else:
            pdfs = pdf_manager.get_pdf_by_category(request.category)
            if not pdfs:
                raise HTTPException(status_code=404, detail=f"No PDFs found for category {request.category}")
            pdf_info = next(iter(pdfs.values()))
            
        # Extract text from PDF
        doc = pdf_info['document']
        text = ""
        for page in doc:
            text += page.get_text()
            
        # Process query with AI
        response = await ai_service.process_query(
            query=request.query,
            context=text,
            model=settings.get("MODEL_NAME")
        )
        
        return response
    except Exception as e:
        logger.error(f"Error processing query: {str(e)}")
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
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/refresh-pdfs")
async def refresh_pdfs() -> Dict:
    """Refresh PDF cache."""
    try:
        pdf_manager.refresh_all()
        return {"message": "PDF cache refreshed successfully"}
    except Exception as e:
        logger.error(f"Error refreshing PDFs: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e)) 