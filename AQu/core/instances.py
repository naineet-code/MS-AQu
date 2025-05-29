from core.pdf_manager import PDFManager
from config.settings import Settings

# Initialize settings
settings = Settings()

# Initialize PDF manager
pdf_manager = PDFManager(settings.get("PDF_DIR"))
pdf_manager.load_pdfs() 