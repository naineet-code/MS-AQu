import os
import logging
from typing import Dict, Optional
import fitz  # PyMuPDF
from pathlib import Path

class PDFManager:
    def __init__(self, pdf_dir: str = "static/pdfs"):
        self.pdf_dir = Path(pdf_dir)
        self.pdf_cache: Dict[str, Dict] = {}
        self.logger = logging.getLogger(__name__)
        
    def load_pdfs(self) -> None:
        """Load all PDFs from the configured directories."""
        try:
            # Load PDFs from both reliance and merchandising directories
            for category in ['reliance', 'merchandising']:
                category_dir = self.pdf_dir / category
                if not category_dir.exists():
                    self.logger.warning(f"Directory {category_dir} does not exist")
                    continue
                    
                for pdf_file in category_dir.glob("*.pdf"):
                    self._load_pdf(pdf_file, category)
                    
            self.logger.info(f"Successfully loaded {len(self.pdf_cache)} PDFs")
        except Exception as e:
            self.logger.error(f"Error loading PDFs: {str(e)}")
            raise
            
    def _load_pdf(self, pdf_path: Path, category: str) -> None:
        """Load a single PDF into the cache."""
        try:
            doc = fitz.open(pdf_path)
            self.pdf_cache[pdf_path.name] = {
                'document': doc,
                'category': category,
                'path': str(pdf_path),
                'pages': len(doc),
                'last_modified': os.path.getmtime(pdf_path)
            }
            self.logger.info(f"Loaded PDF: {pdf_path.name}")
        except Exception as e:
            self.logger.error(f"Error loading PDF {pdf_path}: {str(e)}")
            raise
            
    def get_pdf(self, filename: str) -> Optional[Dict]:
        self.logger.info(f"get_pdf called with filename: {filename}. Current cache keys: {list(self.pdf_cache.keys())}")
        return self.pdf_cache.get(filename)
        
    def get_pdf_by_category(self, category: str) -> Dict[str, Dict]:
        self.logger.info(f"get_pdf_by_category called with category: {category}. Current cache: {[(name, pdf['category']) for name, pdf in self.pdf_cache.items()]}")
        return {name: pdf for name, pdf in self.pdf_cache.items() 
                if pdf['category'] == category}
                
    def refresh_pdf(self, filename: str) -> None:
        """Refresh a specific PDF in the cache."""
        pdf_info = self.pdf_cache.get(filename)
        if pdf_info:
            pdf_path = Path(pdf_info['path'])
            if pdf_path.exists():
                self._load_pdf(pdf_path, pdf_info['category'])
                
    def refresh_all(self) -> None:
        """Refresh all PDFs in the cache."""
        self.pdf_cache.clear()
        self.load_pdfs()
        
    def close_all(self) -> None:
        """Close all PDF documents in the cache."""
        for pdf_info in self.pdf_cache.values():
            pdf_info['document'].close()
        self.pdf_cache.clear() 