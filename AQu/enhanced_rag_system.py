#!/usr/bin/env python3
"""
Enhanced RAG System with Multi-Model Pipeline
- Nano: Text cleanup and preprocessing
- Mini: Relevance scoring and chunk selection
- GPT-4.1: Final analysis and answer generation
"""

import re
import json
import time
import nltk
import ssl
import tiktoken
from typing import List, Dict, Any, Optional, Tuple
from pathlib import Path
import sys
from dataclasses import dataclass
from openai import AzureOpenAI
import httpx
from nltk.tokenize import sent_tokenize, word_tokenize
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

try:
    nltk.data.find('tokenizers/punkt')
except LookupError:
    nltk.download('punkt', quiet=True)

try:
    nltk.data.find('tokenizers/punkt_tab')
except LookupError:
    nltk.download('punkt_tab', quiet=True)

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

@dataclass
class RAGResult:
    """Final result from RAG pipeline"""
    answer: str
    reasoning: str
    top_paragraphs: List[Paragraph]
    citations: List[str]
    processing_time: float
    costs: Dict[str, float]

class EnhancedRAGSystem:
    """Enhanced RAG System with multi-model pipeline"""
    
    def __init__(self):
        self.nano_client = None
        self.mini_client = None
        self.main_client = None
        self.tokenizer = tiktoken.get_encoding("cl100k_base")
        self.paragraph_cache = {}
        self.relevant_paragraphs_storage = []
        # Load pricing config
        with open("config/config.json", "r") as f:
            self.pricing_config = json.load(f)["MODEL_PRICING"]
        logger.info("Initializing Enhanced RAG System...")
        self._initialize_clients()
    
    def _initialize_clients(self):
        """Initialize all Azure OpenAI clients"""
        try:
            # Nano client
            nano_config = get_azure_config('nano')
            self.nano_client = AzureOpenAI(
                api_key=nano_config['api_key'],
                api_version=nano_config['api_version'],
                azure_endpoint=nano_config['endpoint'],
                http_client=httpx.Client()
            )
            self.nano_deployment = nano_config['deployment_name']
            logger.info(f"✓ Nano client initialized: {self.nano_deployment}")
            
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
    
    def cleanup_text_with_nano(self, raw_text: str) -> str:
        """Phase 1: Use Nano to clean and standardize text"""
        logger.info("🧹 Phase 1: Cleaning text with Nano...")
        
        try:
            prompt = f"""Clean and standardize the following text for better processing:

1. Fix encoding issues and special characters
2. Ensure proper sentence boundaries
3. Remove artifacts and noise
4. Maintain paragraph structure
5. Keep page markers intact
6. Return only the cleaned text

Text to clean:
{raw_text[:4000]}"""  # Limit input size for Nano

            start_time = time.time()
            response = self.nano_client.chat.completions.create(
                model=self.nano_deployment,
                messages=[
                    {"role": "system", "content": "You are a text cleaning specialist. Clean and standardize text while preserving structure and meaning."},
                    {"role": "user", "content": prompt}
                ],
                temperature=0.1,
                max_tokens=4000
            )
            
            cleaned_text = response.choices[0].message.content.strip()
            processing_time = time.time() - start_time
            
            logger.info(f"✓ Text cleaned in {processing_time:.2f}s")
            logger.info(f"  Original length: {len(raw_text)} chars")
            logger.info(f"  Cleaned length: {len(cleaned_text)} chars")
            
            return cleaned_text
            
        except Exception as e:
            logger.error(f"Error in text cleanup: {str(e)}")
            return raw_text  # Return original if cleanup fails
    
    def identify_paragraphs(self, cleaned_text: str) -> List[Paragraph]:
        """Phase 2: Identify paragraphs and assign IDs"""
        logger.info("📝 Phase 2: Identifying paragraphs and assigning IDs...")
        
        paragraphs = []
        current_page = 1
        paragraph_count_on_page = 0
        
        # Split by double newlines to identify paragraphs
        raw_paragraphs = re.split(r'\n\s*\n', cleaned_text)
        
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
            
            # Skip very short paragraphs (likely artifacts)
            if len(raw_para.split()) < 5:
                continue
            
            paragraph_count_on_page += 1
            paragraph_id = f"{current_page}_{paragraph_count_on_page}"
            
            paragraph = Paragraph(
                id=paragraph_id,
                text=raw_para,
                page_number=current_page,
                paragraph_number=paragraph_count_on_page,
                cleaned_text=raw_para
            )
            
            paragraphs.append(paragraph)
            
            logger.debug(f"  Created Paragraph {paragraph_id}: {raw_para[:100]}...")
        
        logger.info(f"✓ Identified {len(paragraphs)} paragraphs across {current_page} pages")
        
        # Store in cache
        self.paragraph_cache = {p.id: p for p in paragraphs}
        
        return paragraphs
    
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
                prompt = f"""You are an expert at scoring paragraph relevance to queries. Score each paragraph from 0.0 to 1.0 based on how well it answers the query.

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
                    prompt += f"\nParagraph {para.id}:\n{para.text}\n"
                
                prompt += """
Return JSON format with scores for ALL paragraphs:
{
  "scores": [
    {"id": "1_1", "score": 0.85, "reasoning": "directly explains WSSI components"},
    {"id": "1_2", "score": 0.20, "reasoning": "mentions WSSI but focuses on finance"},
    ...
  ]
}

IMPORTANT: Provide scores for ALL paragraphs, even if score is 0.0."""

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
                    reasoning = score_data.get("reasoning", "")
                    
                    # Find paragraph and update
                    for para in batch:
                        if para.id == para_id:
                            para.relevance_score = score
                            para.reasoning = reasoning
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
                context += f"Paragraph {para.id} (Page {para.page_number}):\n{para.text}\n\n"
            
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
        logger.info(f"🚀 Starting RAG pipeline for query: '{query[:50]}...'")
        total_start_time = time.time()
        
        try:
            # Phase 1: Cleanup
            cleaned_text = self.cleanup_text_with_nano(raw_text)
            
            # Phase 2: Paragraph identification
            paragraphs = self.identify_paragraphs(cleaned_text)
            
            # Phase 3: Relevance scoring
            scored_paragraphs = self.score_relevance_with_mini(query, paragraphs)
            
            # Phase 4: Final analysis
            result = self.analyze_with_gpt4(query, scored_paragraphs)
            
            total_time = time.time() - total_start_time
            result.processing_time = total_time
            
            logger.info(f"🎉 Pipeline completed in {total_time:.2f}s")
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
                "nano": self.nano_client is not None,
                "mini": self.mini_client is not None,
                "main": self.main_client is not None
            }
        }

# Example usage and testing
if __name__ == "__main__":
    # Test the system
    rag_system = EnhancedRAGSystem()
    
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