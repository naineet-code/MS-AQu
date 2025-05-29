#!/usr/bin/env python3
"""
Test script for Enhanced RAG System
"""

import sys
from pathlib import Path
sys.path.append(str(Path(__file__).parent))

from enhanced_rag_system import EnhancedRAGSystem
import logging

# Set up detailed logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.StreamHandler(),
        logging.FileHandler('rag_test.log')
    ]
)

def test_enhanced_rag():
    """Test the enhanced RAG system with sample data"""
    print("🧪 Testing Enhanced RAG System")
    print("=" * 50)
    
    # Initialize the system
    try:
        rag_system = EnhancedRAGSystem()
        print("✓ RAG System initialized successfully")
    except Exception as e:
        print(f"❌ Failed to initialize RAG system: {e}")
        return
    
    # Sample PDF-like text with page markers
    sample_text = """
    [Page 1]
    WSSI (Water Supply System Infrastructure) is a critical component of municipal water management. The system includes pumps, pipes, treatment facilities, and distribution networks that ensure clean water reaches all residents.
    
    The financial performance of WSSI projects has shown consistent improvement over the past five years. Revenue increased by 15% annually, with operational costs decreasing by 8% due to efficiency improvements.
    
    [Page 2]
    Technical specifications for WSSI include high-pressure pumps capable of 500 GPM flow rates, corrosion-resistant piping materials, and automated monitoring systems for real-time quality control.
    
    Implementation of WSSI upgrades follows a phased approach: Phase 1 involves infrastructure assessment, Phase 2 covers equipment procurement, and Phase 3 handles installation and testing.
    
    [Page 3]
    Environmental impact assessments for WSSI projects indicate minimal ecological disruption when proper mitigation measures are implemented. Water quality improvements benefit both human health and aquatic ecosystems.
    
    The regulatory framework governing WSSI operations includes federal EPA guidelines, state water quality standards, and local municipal codes that ensure compliance and safety.
    
    [Page 4]
    Cost-benefit analysis of WSSI investments shows a positive return within 7-10 years. Initial capital expenditure is offset by reduced maintenance costs and improved service reliability.
    
    Future expansion plans for WSSI include smart meter integration, predictive maintenance systems, and renewable energy integration to reduce operational carbon footprint.
    """
    
    # Test queries
    test_queries = [
        "What is WSSI and what does it include?",
        "What information is available about WSSI financial performance?",
        "What are the technical specifications for WSSI?",
        "What are the environmental impacts of WSSI projects?"
    ]
    
    print(f"\n📝 Sample text length: {len(sample_text)} characters")
    print(f"🔍 Testing {len(test_queries)} queries")
    
    # Process each query
    for i, query in enumerate(test_queries, 1):
        print(f"\n{'='*60}")
        print(f"TEST {i}: {query}")
        print('='*60)
        
        try:
            # Process the query
            result = rag_system.process_query(query, sample_text)
            
            # Display results
            print(f"\n📊 RESULTS FOR QUERY {i}")
            print("-" * 30)
            print(f"Answer: {result.answer}")
            print(f"\nReasoning: {result.reasoning}")
            print(f"\nCitations: {result.citations}")
            print(f"\nTop Paragraphs Used:")
            for j, para in enumerate(result.top_paragraphs, 1):
                print(f"  {j}. Paragraph {para.id} (Page {para.page_number})")
                print(f"     Score: {para.relevance_score:.3f}")
                print(f"     Text: {para.text[:100]}...")
            
            print(f"\nProcessing Time: {result.processing_time:.2f} seconds")
            
        except Exception as e:
            print(f"❌ Error processing query {i}: {e}")
            import traceback
            traceback.print_exc()
    
    # Display system debug info
    print(f"\n{'='*60}")
    print("SYSTEM DEBUG INFO")
    print('='*60)
    debug_info = rag_system.debug_info()
    for key, value in debug_info.items():
        print(f"{key}: {value}")
    
    # Display stored paragraphs
    stored_paragraphs = rag_system.get_stored_paragraphs()
    print(f"\nStored Relevant Paragraphs: {len(stored_paragraphs)}")
    for para in stored_paragraphs:
        print(f"  - Paragraph {para.id}: Score {para.relevance_score:.3f}")

if __name__ == "__main__":
    test_enhanced_rag() 