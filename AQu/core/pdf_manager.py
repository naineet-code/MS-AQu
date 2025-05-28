import os
import logging
from typing import Dict, Optional
import fitz  # PyMuPDF
from pathlib import Path
import re

class PDFManager:
    def __init__(self, pdf_dir: str = "static/pdfs"):
        self.pdf_dir = Path(pdf_dir)
        self.pdf_cache: Dict[str, Dict] = {}
        self.logger = logging.getLogger(__name__)
        
    def load_pdfs(self) -> None:
        """Load all PDFs from the configured directories."""
        try:
            # Clear the cache first
            self.pdf_cache.clear()
            
            # Load PDFs from both reliance and merchandising directories
            for category in ['reliance', 'merchandising']:
                category_dir = self.pdf_dir / category
                if not category_dir.exists():
                    self.logger.warning(f"Directory {category_dir} does not exist")
                    continue
                    
                self.logger.info(f"Loading PDFs from category: {category}")
                pdf_count = 0
                for pdf_file in category_dir.glob("*.pdf"):
                    self._load_pdf(pdf_file, category)
                    pdf_count += 1
                self.logger.info(f"Loaded {pdf_count} PDFs from category: {category}")
                    
            self.logger.info(f"Successfully loaded {len(self.pdf_cache)} PDFs total")
            self.logger.info(f"PDF cache contents: {[(name, pdf['category']) for name, pdf in self.pdf_cache.items()]}")
        except Exception as e:
            self.logger.error(f"Error loading PDFs: {str(e)}")
            raise
            
    def _load_pdf(self, pdf_path: Path, category: str) -> None:
        """Load a single PDF into the cache."""
        try:
            if not pdf_path.exists():
                self.logger.error(f"PDF file does not exist: {pdf_path}")
                raise FileNotFoundError(f"PDF file does not exist: {pdf_path}")
                
            if pdf_path.name in self.pdf_cache:
                self.logger.info(f"PDF already in cache, refreshing: {pdf_path.name}")
                self.pdf_cache[pdf_path.name]['document'].close()
                
            doc = fitz.open(pdf_path)
            if not doc:
                raise ValueError(f"Failed to open PDF: {pdf_path}")
                
            self.pdf_cache[pdf_path.name] = {
                'document': doc,
                'category': category,
                'path': str(pdf_path),
                'pages': len(doc),
                'last_modified': os.path.getmtime(pdf_path)
            }
            self.logger.info(f"Successfully loaded PDF: {pdf_path.name} (category: {category}, pages: {len(doc)})")
        except Exception as e:
            self.logger.error(f"Error loading PDF {pdf_path}: {str(e)}")
            if pdf_path.name in self.pdf_cache:
                del self.pdf_cache[pdf_path.name]
            raise
            
    def get_pdf(self, filename: str) -> Optional[Dict]:
        self.logger.info(f"get_pdf called with filename: {filename}. Current cache keys: {list(self.pdf_cache.keys())}")
        return self.pdf_cache.get(filename)
        
    def get_pdf_by_category(self, category: str) -> Dict[str, Dict]:
        self.logger.info(f"get_pdf_by_category called with category: {category}. Current cache: {[(name, pdf['category']) for name, pdf in self.pdf_cache.items()]}")
        return {name: pdf for name, pdf in self.pdf_cache.items() 
                if pdf['category'] == category}
                
    def clean_text(self, text: str) -> str:
        """
        Remove non-printable and unwanted characters from text, but keep standard ASCII and common Unicode symbols.
        """
        # Whitelist: ASCII printable, whitespace, and common Unicode symbols
        allowed = (
            r'\x20-\x7E'  # ASCII printable
            r'\n\r\t'    # whitespace
            r'₹€£¥'         # currency
            r'°±×÷−µ'       # math
            r'α-ωΑ-Ω'      # Greek (lower and upper)
            r'→←↑↓⇒⇐⇑⇓'   # arrows
            r'•●○'         # bullets
            r'""'''         # quotes
            r'©®™'          # copyright/trademark
        )
        # Remove all characters not in the allowed set
        return re.sub(fr'[^{{{allowed}}}]', '', text)
                
    def get_category_content(self, category: str) -> str:
        """Get all content from PDFs in a specific category."""
        try:
            category_pdfs = self.get_pdf_by_category(category)
            if not category_pdfs:
                self.logger.warning(f"No PDFs found for category: {category}")
                return ""
                
            content = []
            for pdf_name, pdf_info in category_pdfs.items():
                doc = pdf_info['document']
                for page_num, page in enumerate(doc, 1):
                    text = page.get_text()
                    text = self.clean_text(text)
                    # Add page number information to the text
                    content.append(f"[Page {page_num}]\n{text}")
                    
            return "\n".join(content)
        except Exception as e:
            self.logger.error(f"Error getting category content: {str(e)}")
            raise
                
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