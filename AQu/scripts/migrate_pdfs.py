import os
import shutil
from pathlib import Path
import logging

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def migrate_pdfs():
    """Migrate PDFs to the new directory structure."""
    try:
        # Create new directory structure
        base_dir = Path(__file__).parent.parent
        pdf_dir = base_dir / "static" / "pdfs"
        reliance_dir = pdf_dir / "reliance"
        merchandising_dir = pdf_dir / "merchandising"
        
        # Create directories if they don't exist
        for dir_path in [pdf_dir, reliance_dir, merchandising_dir]:
            dir_path.mkdir(parents=True, exist_ok=True)
            
        # Move PDFs from old location
        old_pdf_dir = base_dir / "pdf"
        if old_pdf_dir.exists():
            # Move source.pdf to reliance
            source_pdf = old_pdf_dir / "source.pdf"
            if source_pdf.exists():
                shutil.move(str(source_pdf), str(reliance_dir / "source.pdf"))
                logger.info("Moved source.pdf to reliance directory")
                
            # Move other PDFs to merchandising
            for pdf_file in old_pdf_dir.glob("*.pdf"):
                if pdf_file.name != "source.pdf":
                    shutil.move(str(pdf_file), str(merchandising_dir / pdf_file.name))
                    logger.info(f"Moved {pdf_file.name} to merchandising directory")
                    
            # Remove old directory if empty
            if not any(old_pdf_dir.iterdir()):
                old_pdf_dir.rmdir()
                logger.info("Removed old PDF directory")
                
        logger.info("PDF migration completed successfully")
        
    except Exception as e:
        logger.error(f"Error during PDF migration: {str(e)}")
        raise

if __name__ == "__main__":
    migrate_pdfs() 