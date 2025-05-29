#!/usr/bin/env python3
"""
Integrated PDF RAG System
Combines PDF processing with Enhanced RAG System
"""

import sys
from pathlib import Path
sys.path.append(str(Path(__file__).parent))

from enhanced_rag_system import EnhancedRAGSystem, RAGResult
from pdf_manager import PDFManager
import logging
import time
from typing import Optional

# Setup logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

class IntegratedPDFRAG:
    """Integrated system combining PDF processing with Enhanced RAG"""
    
    def __init__(self):
        self.pdf_manager = PDFManager()
        self.rag_system = EnhancedRAGSystem()
        logger.info("Integrated PDF RAG System initialized")
    
    def load_pdf(self, pdf_path: str) -> bool:
        """Load and process PDF"""
        try:
            logger.info(f"Loading PDF: {pdf_path}")
            success = self.pdf_manager.load_pdf(pdf_path)
            if success:
                logger.info("✓ PDF loaded successfully")
                return True
            else:
                logger.error("❌ Failed to load PDF")
                return False
        except Exception as e:
            logger.error(f"Error loading PDF: {str(e)}")
            return False
    
    def query_pdf(self, query: str) -> Optional[RAGResult]:
        """Query the loaded PDF using enhanced RAG"""
        try:
            logger.info(f"Processing query: '{query}'")
            
            # Get raw text from PDF manager
            if not hasattr(self.pdf_manager, 'text') or not self.pdf_manager.text:
                logger.error("No PDF text available. Please load a PDF first.")
                return None
            
            raw_text = self.pdf_manager.text
            logger.info(f"Retrieved {len(raw_text)} characters from PDF")
            
            # Process with enhanced RAG
            result = self.rag_system.process_query(query, raw_text)
            
            logger.info("✓ Query processed successfully")
            return result
            
        except Exception as e:
            logger.error(f"Error processing query: {str(e)}")
            return None
    
    def get_pdf_info(self) -> dict:
        """Get information about the loaded PDF"""
        if hasattr(self.pdf_manager, 'text') and self.pdf_manager.text:
            return {
                "text_length": len(self.pdf_manager.text),
                "has_pdf": True,
                "paragraph_cache_size": len(self.rag_system.paragraph_cache),
                "stored_paragraphs": len(self.rag_system.relevant_paragraphs_storage)
            }
        else:
            return {
                "text_length": 0,
                "has_pdf": False,
                "paragraph_cache_size": 0,
                "stored_paragraphs": 0
            }

def main():
    """Main function for testing"""
    print("🔗 Integrated PDF RAG System Test")
    print("=" * 50)
    
    # Initialize system
    integrated_system = IntegratedPDFRAG()
    
    # Check if there's a PDF to test with
    pdf_path = "data/sample.pdf"  # Adjust path as needed
    
    if Path(pdf_path).exists():
        print(f"📄 Testing with PDF: {pdf_path}")
        
        # Load PDF
        if integrated_system.load_pdf(pdf_path):
            # Get PDF info
            info = integrated_system.get_pdf_info()
            print(f"📊 PDF Info: {info}")
            
            # Test queries
            test_queries = [
                "What is WSSI?",
                "What are the financial metrics mentioned?",
                "What technical specifications are provided?"
            ]
            
            for i, query in enumerate(test_queries, 1):
                print(f"\n{'='*60}")
                print(f"TEST QUERY {i}: {query}")
                print('='*60)
                
                result = integrated_system.query_pdf(query)
                
                if result:
                    print(f"Answer: {result.answer}")
                    print(f"Citations: {result.citations}")
                    print(f"Processing Time: {result.processing_time:.2f}s")
                    print(f"Top Paragraphs: {[p.id for p in result.top_paragraphs]}")
                else:
                    print("❌ Failed to get result")
        else:
            print("❌ Failed to load PDF")
    else:
        print(f"⚠️  PDF not found at {pdf_path}")
        print("Testing with sample text instead...")
        
        # Test with sample text
        sample_text = """
        [Page 1]
        WSSI (Water Supply System Infrastructure) is a critical component of municipal water management.
        
        Financial performance shows 15% annual revenue growth with 8% cost reduction.
        
        [Page 2]
        Technical specifications include 500 GPM pumps and corrosion-resistant materials.
        """
        
        result = integrated_system.rag_system.process_query("What is WSSI?", sample_text)
        print(f"Sample Result: {result.answer}")

if __name__ == "__main__":
    main() 