#!/usr/bin/env python3
"""
Enhanced RAG System with NLTK-based Text Processing
- NLTK: Text cleanup, preprocessing, and paragraph identification
- Mini: Relevance scoring and chunk selection
- GPT-4.1: Final analysis and answer generation
"""

import re
import json
import time
import nltk
import ssl
import tiktoken
import string
from typing import List, Dict, Any, Optional, Tuple
from pathlib import Path
import sys
from dataclasses import dataclass
from openai import AzureOpenAI
import httpx
from nltk.tokenize import sent_tokenize, word_tokenize
from nltk.corpus import stopwords
from nltk.stem import WordNetLemmatizer
import logging

# Setup logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# Add config path
sys.path.append(str(Path(__file__).parent))
from config.credentials import get_azure_config

# Download NLTK data
try:
    _create_unverified_https_context = ssl._create_unverified_context
except AttributeError:
    pass
else:
    ssl._create_default_https_context = _create_unverified_https_context

# Download required NLTK data
nltk_downloads = [
    'punkt',
    'punkt_tab', 
    'stopwords',
    'wordnet',
    'averaged_perceptron_tagger',
    'omw-1.4'
]

for item in nltk_downloads:
    try:
        if item in ['punkt', 'punkt_tab']:
            path = f'tokenizers/{item}'
        elif item in ['stopwords', 'wordnet', 'omw-1.4']:
            path = f'corpora/{item}'
        else:
            path = f'taggers/{item}'
        nltk.data.find(path)
    except LookupError:
        try:
            nltk.download(item, quiet=True)
            logger.info(f"Downloaded NLTK data: {item}")
        except Exception as e:
            logger.warning(f"Could not download {item}: {e}")

@dataclass
class Paragraph:
    """Represents a paragraph with metadata"""
    id: str  # Format: page_number_paragraph_number
    text: str
    page_number: int
    paragraph_number: int
    cleaned_text: str = ""
    relevance_score: float = 0.0
    reasoning: str = ""
    word_count: int = 0
    sentence_count: int = 0

@dataclass
class RAGResult:
    """Final result from RAG pipeline"""
    answer: str
    reasoning: str
    top_paragraphs: List[Paragraph]
    citations: List[str]
    processing_time: float
    costs: Dict[str, float]

class NLTKTextProcessor:
    """NLTK-based text processing utilities"""
    
    def __init__(self):
        try:
            self.lemmatizer = WordNetLemmatizer()
            self.stop_words = set(stopwords.words('english'))
        except Exception as e:
            logger.warning(f"Could not initialize some NLTK components: {e}")
            self.lemmatizer = None
            self.stop_words = set()
    
    def clean_text(self, text: str) -> str:
        """Clean and standardize text using NLTK and regex"""
        logger.info("🧹 Phase 1: Cleaning text with NLTK...")
        start_time = time.time()
        
        # Step 1: Basic cleaning
        # Remove extra whitespace and normalize line breaks
        text = re.sub(r'\s+', ' ', text)
        text = re.sub(r'\n\s*\n', '\n\n', text)
        
        # Step 2: Fix common encoding issues
        encoding_fixes = {
            'â€™': "'",
            'â€œ': '"',
            'â€': '"',
            'â€"': '—',
            'â€"': '–',
            'Â': '',
            'â€¢': '•',
            'â€¦': '...',
        }
        
        for bad, good in encoding_fixes.items():
            text = text.replace(bad, good)
        
        # Step 3: Normalize punctuation and quotes
        text = re.sub(r'["""]', '"', text)
        text = re.sub(r"[''']", "'", text)
        text = re.sub(r'[–—]', '-', text)
        
        # Step 4: Remove excessive punctuation
        text = re.sub(r'\.{3,}', '...', text)
        text = re.sub(r'[!]{2,}', '!', text)
        text = re.sub(r'[?]{2,}', '?', text)
        
        # Step 5: Fix sentence boundaries
        # Ensure space after periods, commas, etc.
        text = re.sub(r'\.([A-Z])', r'. \1', text)
        text = re.sub(r',([A-Za-z])', r', \1', text)
        
        # Step 6: Remove artifacts and noise
        # Remove standalone numbers that might be artifacts
        text = re.sub(r'\b\d{1,2}\b(?!\s*[A-Za-z])', '', text)
        
        # Remove excessive spaces
        text = re.sub(r' {2,}', ' ', text)
        
        # Step 7: Preserve page markers but clean them
        text = re.sub(r'\[Page\s+(\d+)\]', r'[Page \1]', text)
        
        processing_time = time.time() - start_time
        logger.info(f"✓ Text cleaned with NLTK in {processing_time:.2f}s")
        logger.info(f"  Original length: {len(text)} chars")
        
        return text.strip()
    
    def identify_paragraphs(self, cleaned_text: str) -> List[Paragraph]:
        """Identify paragraphs using NLTK and assign IDs"""
        logger.info("📝 Phase 2: Identifying paragraphs with NLTK...")
        start_time = time.time()
        
        paragraphs = []
        current_page = 1
        paragraph_count_on_page = 0
        
        # Split by double newlines and empty lines to identify paragraphs
        # This is more reliable than NLTK's paragraph_tokenize for our use case
        raw_paragraphs = re.split(r'\n\s*\n+', cleaned_text)
        
        for raw_para in raw_paragraphs:
            raw_para = raw_para.strip()
            if not raw_para:
                continue
            
            # Check for page markers
            page_match = re.search(r'\[Page (\d+)\]', raw_para)
            if page_match:
                current_page = int(page_match.group(1))
                paragraph_count_on_page = 0
                # Remove page marker from text
                raw_para = re.sub(r'\[Page \d+\]\s*', '', raw_para).strip()
                if not raw_para:
                    continue
            
            # Use NLTK to analyze paragraph quality
            sentences = sent_tokenize(raw_para)
            words = word_tokenize(raw_para)
            
            # Skip very short paragraphs (likely artifacts)
            if len(words) < 5 or len(sentences) == 0:
                continue
            
            # Skip paragraphs that are mostly numbers or special characters
            alpha_ratio = sum(1 for char in raw_para if char.isalpha()) / len(raw_para)
            if alpha_ratio < 0.5:
                continue
            
            paragraph_count_on_page += 1
            paragraph_id = f"{current_page}_{paragraph_count_on_page}"
            
            # Clean the paragraph text further
            cleaned_para = self._clean_paragraph(raw_para)
            
            paragraph = Paragraph(
                id=paragraph_id,
                text=raw_para,
                page_number=current_page,
                paragraph_number=paragraph_count_on_page,
                cleaned_text=cleaned_para,
                word_count=len(words),
                sentence_count=len(sentences)
            )
            
            paragraphs.append(paragraph)
            
            logger.debug(f"  Created Paragraph {paragraph_id}: {len(words)} words, {len(sentences)} sentences")
        
        processing_time = time.time() - start_time
        logger.info(f"✓ Identified {len(paragraphs)} paragraphs across {current_page} pages in {processing_time:.2f}s")
        
        return paragraphs
    
    def _clean_paragraph(self, paragraph: str) -> str:
        """Clean individual paragraph"""
        # Remove extra whitespace
        paragraph = re.sub(r'\s+', ' ', paragraph)
        
        # Ensure proper sentence endings
        paragraph = re.sub(r'([.!?])\s*([A-Z])', r'\1 \2', paragraph)
        
        # Remove trailing/leading punctuation artifacts
        paragraph = paragraph.strip(' .,;:')
        
        return paragraph

class EnhancedRAGSystemNLTK:
    """Enhanced RAG System with NLTK-based text processing"""
    
    def __init__(self):
        self.mini_client = None
        self.main_client = None
        self.tokenizer = tiktoken.get_encoding("cl100k_base")
        self.paragraph_cache = {}
        self.relevant_paragraphs_storage = []
        self.text_processor = NLTKTextProcessor()
        # Load pricing config
        with open("config/config.json", "r") as f:
            self.pricing_config = json.load(f)["MODEL_PRICING"]
        logger.info("Initializing Enhanced RAG System with NLTK...")
        self._initialize_clients()
    
    def _initialize_clients(self):
        """Initialize Azure OpenAI clients (no Nano needed)"""
        try:
            # Mini client
            mini_config = get_azure_config('mini')
            self.mini_client = AzureOpenAI(
                api_key=mini_config['api_key'],
                api_version=mini_config['api_version'],
                azure_endpoint=mini_config['endpoint'],
                http_client=httpx.Client()
            )
            self.mini_deployment = mini_config['deployment_name']
            logger.info(f"✓ Mini client initialized: {self.mini_deployment}")
            
            # Main client (GPT-4.1)
            main_config = get_azure_config('main')
            self.main_client = AzureOpenAI(
                api_key=main_config['api_key'],
                api_version=main_config['api_version'],
                azure_endpoint=main_config['endpoint'],
                http_client=httpx.Client()
            )
            self.main_deployment = main_config['deployment_name']
            logger.info(f"✓ Main client initialized: {self.main_deployment}")
            
        except Exception as e:
            logger.error(f"Failed to initialize clients: {str(e)}")
            raise
    
    def score_relevance_with_mini(self, query: str, paragraphs: List[Paragraph]) -> List[Paragraph]:
        """Phase 3: Use Mini to score paragraph relevance"""
        logger.info("🎯 Phase 3: Scoring relevance with Mini...")
        
        scored_paragraphs = []
        batch_size = 10  # Process in batches to avoid token limits
        
        for i in range(0, len(paragraphs), batch_size):
            batch = paragraphs[i:i + batch_size]
            logger.info(f"  Processing batch {i//batch_size + 1}/{(len(paragraphs) + batch_size - 1)//batch_size}")
            
            try:
                # Create prompt for batch scoring
                prompt = f"""Score paragraph relevance to the query from 0.0 to 1.0.

Scoring Guidelines:
- 1.0: Directly answers the query with specific information
- 0.7-0.9: Contains relevant information that partially answers the query
- 0.4-0.6: Contains related information but doesn't directly answer
- 0.1-0.3: Mentions related concepts but not very relevant
- 0.0: No relevance to the query

Query: {query}

Paragraphs to score:
"""
                for para in batch:
                    prompt += f"\nParagraph {para.id}:\n{para.cleaned_text}\n"
                
                prompt += """
Return JSON with scores only:
{
  "scores": [
    {"id": "1_1", "score": 0.85},
    {"id": "1_2", "score": 0.20},
    ...
  ]
}

IMPORTANT: Provide scores for ALL paragraphs."""

                start_time = time.time()
                response = self.mini_client.chat.completions.create(
                    model=self.mini_deployment,
                    messages=[
                        {"role": "system", "content": "You are a relevance scoring expert. Score paragraphs 0-1 based on query relevance."},
                        {"role": "user", "content": prompt}
                    ],
                    response_format={"type": "json_object"},
                    temperature=0.3,
                    max_tokens=1000
                )
                
                result = json.loads(response.choices[0].message.content)
                processing_time = time.time() - start_time
                
                # Update paragraphs with scores
                for score_data in result.get("scores", []):
                    para_id = score_data.get("id")
                    score = score_data.get("score", 0.0)
                    
                    # Find paragraph and update
                    for para in batch:
                        if para.id == para_id:
                            para.relevance_score = score
                            para.reasoning = f"Relevance score: {score:.2f}"
                            break
                
                scored_paragraphs.extend(batch)
                logger.info(f"  ✓ Batch scored in {processing_time:.2f}s")
                
            except Exception as e:
                logger.error(f"Error scoring batch: {str(e)}")
                # Add paragraphs with default scores
                for para in batch:
                    para.relevance_score = 0.1
                    para.reasoning = "Error in scoring"
                scored_paragraphs.extend(batch)
        
        # Sort by relevance score
        scored_paragraphs.sort(key=lambda p: p.relevance_score, reverse=True)
        
        logger.info("✓ Relevance scoring completed")
        for i, para in enumerate(scored_paragraphs[:10]):  # Show top 10
            logger.info(f"  {i+1}. Paragraph {para.id}: {para.relevance_score:.3f} - {para.reasoning[:50]}...")
        
        return scored_paragraphs
    
    def analyze_with_gpt4(self, query: str, top_paragraphs: List[Paragraph]) -> RAGResult:
        """Phase 4: Use GPT-4.1 for final analysis"""
        logger.info("🧠 Phase 4: Final analysis with GPT-4.1...")
        
        # Take top 5 paragraphs
        top_5 = top_paragraphs[:5]
        
        try:
            # Create context with paragraph names
            context = "Context paragraphs:\n\n"
            for i, para in enumerate(top_5):
                context += f"Paragraph {para.id} (Page {para.page_number}, {para.word_count} words):\n{para.cleaned_text}\n\n"
            
            prompt = f"""Based on the provided context paragraphs, answer the query with detailed reasoning.

Query: {query}

{context}

Please provide:
1. A comprehensive answer to the query
2. Detailed reasoning for your answer
3. Specific citations using paragraph IDs (e.g., "Paragraph 1_2")
4. Confidence level in your answer

Format your response as JSON:
{{
  "answer": "detailed answer here",
  "reasoning": "step by step reasoning",
  "citations": ["Paragraph 1_2", "Paragraph 2_1"],
  "confidence": 0.85
}}"""

            start_time = time.time()
            response = self.main_client.chat.completions.create(
                model=self.main_deployment,
                messages=[
                    {"role": "system", "content": "You are an expert analyst. Provide comprehensive answers with detailed reasoning and accurate citations."},
                    {"role": "user", "content": prompt}
                ],
                response_format={"type": "json_object"},
                temperature=0.2,
                max_tokens=2000
            )
            
            result = json.loads(response.choices[0].message.content)
            processing_time = time.time() - start_time
            
            # Calculate cost for main model
            usage = response.usage
            pricing = self.pricing_config.get("gpt-4.1", self.pricing_config[self.settings.get("AZURE_OPENAI_DEPLOYMENT_MINI")])
            input_cost = (usage.prompt_tokens / 1_000_000) * pricing["input"]
            output_cost = (usage.completion_tokens / 1_000_000) * pricing["output"]
            total_cost = input_cost + output_cost
            costs = [{
                "model": "GPT-4.1",
                "input_tokens": usage.prompt_tokens,
                "output_tokens": usage.completion_tokens,
                "total_tokens": usage.total_tokens,
                "input_cost": round(input_cost, 6),
                "output_cost": round(output_cost, 6),
                "total_cost": round(total_cost, 6)
            }]
            
            # Store relevant paragraphs
            self.relevant_paragraphs_storage.extend(top_5)
            
            logger.info(f"✓ Analysis completed in {processing_time:.2f}s")
            logger.info(f"  Answer length: {len(result.get('answer', ''))} chars")
            logger.info(f"  Citations: {result.get('citations', [])}")
            logger.info(f"  Confidence: {result.get('confidence', 0)}")
            
            return RAGResult(
                answer=result.get("answer", "No answer generated"),
                reasoning=result.get("reasoning", "No reasoning provided"),
                top_paragraphs=top_5,
                citations=result.get("citations", []),
                processing_time=processing_time,
                costs=costs
            )
            
        except Exception as e:
            logger.error(f"Error in GPT-4.1 analysis: {str(e)}")
            return RAGResult(
                answer=f"Error in analysis: {str(e)}",
                reasoning="Analysis failed due to technical error",
                top_paragraphs=top_5,
                citations=[],
                processing_time=0.0,
                costs={"total": 0.0}
            )
    
    def process_query(self, query: str, raw_text: str) -> RAGResult:
        """Main pipeline: Process query through all phases"""
        logger.info(f"🚀 Starting NLTK-based RAG pipeline for query: '{query[:50]}...'")
        total_start_time = time.time()
        
        try:
            # Phase 1: NLTK-based cleanup
            cleaned_text = self.text_processor.clean_text(raw_text)
            
            # Phase 2: NLTK-based paragraph identification
            paragraphs = self.text_processor.identify_paragraphs(cleaned_text)
            
            # Phase 3: Relevance scoring with Mini
            scored_paragraphs = self.score_relevance_with_mini(query, paragraphs)
            
            # Phase 4: Final analysis with GPT-4.1
            result = self.analyze_with_gpt4(query, scored_paragraphs)
            
            total_time = time.time() - total_start_time
            result.processing_time = total_time
            
            logger.info(f"🎉 NLTK-based pipeline completed in {total_time:.2f}s")
            logger.info(f"  Total paragraphs processed: {len(paragraphs)}")
            logger.info(f"  Top 5 paragraphs selected for analysis")
            logger.info(f"  Stored {len(self.relevant_paragraphs_storage)} relevant paragraphs")
            
            return result
            
        except Exception as e:
            logger.error(f"Pipeline failed: {str(e)}")
            return RAGResult(
                answer=f"Pipeline failed: {str(e)}",
                reasoning="Technical error in processing",
                top_paragraphs=[],
                citations=[],
                processing_time=time.time() - total_start_time,
                costs={"total": 0.0}
            )
    
    def get_stored_paragraphs(self) -> List[Paragraph]:
        """Get all stored relevant paragraphs"""
        return self.relevant_paragraphs_storage
    
    def debug_info(self) -> Dict[str, Any]:
        """Get debugging information"""
        return {
            "paragraph_cache_size": len(self.paragraph_cache),
            "stored_paragraphs_count": len(self.relevant_paragraphs_storage),
            "clients_initialized": {
                "mini": self.mini_client is not None,
                "main": self.main_client is not None
            },
            "nltk_processor_ready": self.text_processor is not None
        }

# Example usage and testing
if __name__ == "__main__":
    # Test the system
    rag_system = EnhancedRAGSystemNLTK()
    
    # Sample text for testing
    sample_text = """
    [Page 1]
    This is the first paragraph on page one. It contains important information about the company's financial performance.
    
    This is the second paragraph on page one. It discusses the market conditions and competitive landscape.
    
    [Page 2]
    This is the first paragraph on page two. It covers the technical specifications and product details.
    
    This is the second paragraph on page two. It explains the implementation strategy and timeline.
    """
    
    # Test query
    test_query = "What information is available about financial performance?"
    
    # Process the query
    result = rag_system.process_query(test_query, sample_text)
    
    print("\n" + "="*50)
    print("FINAL RESULT")
    print("="*50)
    print(f"Answer: {result.answer}")
    print(f"Reasoning: {result.reasoning}")
    print(f"Citations: {result.citations}")
    print(f"Processing Time: {result.processing_time:.2f}s")
    print(f"Top Paragraphs: {[p.id for p in result.top_paragraphs]}") 