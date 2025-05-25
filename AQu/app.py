from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from config.logging_config import setup_logging, get_logger
from config.settings import Settings
from core.pdf_manager import PDFManager
from api.routes import router as api_router
import uvicorn

# Initialize logging
setup_logging()

# Initialize settings
settings = Settings()
if not settings.validate():
    raise RuntimeError("Invalid configuration")

# Initialize PDF manager
pdf_manager = PDFManager(settings.get("PDF_DIR"))
pdf_manager.load_pdfs()

# Create FastAPI app
app = FastAPI(
    title="AQu API",
    description="AI-powered Question Answering API",
    version="1.0.0"
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Update this with specific origins in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API routes
app.include_router(api_router, prefix="/api")

@app.on_event("shutdown")
async def shutdown_event():
    """Clean up resources on shutdown."""
    pdf_manager.close_all()

if __name__ == "__main__":
    uvicorn.run(
        "app:app",
        host="0.0.0.0",
        port=8000,
        reload=True
    ) 