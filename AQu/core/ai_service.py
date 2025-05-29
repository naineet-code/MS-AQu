import os
import logging
import time
from typing import Dict, List, Optional, Any
import openai
from openai import AzureOpenAI
import httpx
from config.settings import Settings
from new_search import navigate_to_paragraphs, generate_answer, split_into_50_chunks
import json
import datetime

class AIService:
    def __init__(self):
        self.logger = logging.getLogger(__name__)
        self.settings = Settings()
        self.logger.info(f"Settings loaded: {self.settings.config}")
        self.client = self._initialize_client()
        # Load pricing configuration
        with open("config/config.json", "r") as f:
            self.pricing_config = json.load(f)["MODEL_PRICING"]
        # Set model name from settings
        self.model_name = self.settings.get("AZURE_OPENAI_DEPLOYMENT_MINI")
        
    def _initialize_client(self) -> AzureOpenAI:
        """Initialize the Azure OpenAI client."""
        try:
            api_key = self.settings.get("AZURE_OPENAI_API_KEY_MINI", "").strip()
            api_version = self.settings.get("AZURE_OPENAI_API_VERSION_MINI", "").strip()
            azure_endpoint = self.settings.get("AZURE_OPENAI_ENDPOINT_MINI", "").strip()
            
            if not all([api_key, api_version, azure_endpoint]):
                self.logger.error("Missing required Azure OpenAI environment variables")
                raise ValueError("Missing required Azure OpenAI environment variables")
            
            self.logger.info(f"Initializing Azure OpenAI client with:")
            self.logger.info(f"API Key: {api_key[:8]}...")
            self.logger.info(f"API Version: {api_version}")
            self.logger.info(f"Azure Endpoint: {azure_endpoint}")
            
            return AzureOpenAI(
                api_key=api_key,
                api_version=api_version,
                azure_endpoint=azure_endpoint,
                http_client=httpx.Client()
            )
        except Exception as e:
            self.logger.error(f"Error initializing Azure OpenAI client: {str(e)}")
            raise
            
    def _calculate_cost(self, model: str, input_tokens: int, output_tokens: int, is_cached: bool = False) -> Dict:
        """Calculate costs based on token usage and model pricing."""
        if model not in self.pricing_config:
            self.logger.warning(f"Unknown model {model}, using default pricing")
            model = self.settings.get("AZURE_OPENAI_DEPLOYMENT_MINI")
        
        pricing = self.pricing_config[model]
        input_rate = pricing["cachedInput"] if is_cached else pricing["input"]
        output_rate = pricing["output"]
        
        # Calculate costs per million tokens
        input_cost = (input_tokens / 1_000_000) * input_rate
        output_cost = (output_tokens / 1_000_000) * output_rate
        total_cost = input_cost + output_cost
        
        return {
            "inputCost": round(input_cost, 6),
            "outputCost": round(output_cost, 6),
            "totalCost": round(total_cost, 6),
            "model": pricing["name"]
        }

    def process_query(self, query: str, pdf_content: str) -> Dict:
        """Process a query and return the answer with reasoning."""
        try:
            # Get relevant paragraphs
            relevant_paragraphs = self._get_relevant_paragraphs(query, pdf_content)
            
            if not relevant_paragraphs:
                return self._create_empty_response(
                    "I couldn't find any specific information about your question in the available documentation.",
                    "No relevant paragraphs were found in the documentation."
                )
            
            # Generate reasoning using mini model
            reasoning_prompt = f"""Question: {query}

Context:
{json.dumps(relevant_paragraphs, indent=2)}

Instructions:
1. Explain your reasoning for selecting these paragraphs
2. Explain how they relate to the question
3. Be concise but clear
4. Use markdown formatting

Reasoning:"""

            reasoning_response = self.client.chat.completions.create(
                model=self.model_name,
                messages=[
                    {"role": "system", "content": "You are a helpful AI assistant that explains reasoning clearly."},
                    {"role": "user", "content": reasoning_prompt}
                ],
                temperature=0.3,
                max_tokens=500
            )
            
            reasoning = reasoning_response.choices[0].message.content.strip()
            
            # Calculate reasoning costs
            reasoning_costs = self._calculate_cost(
                self.model_name,
                reasoning_response.usage.prompt_tokens,
                reasoning_response.usage.completion_tokens
            )
            
            # Generate answer using mini model
            answer_prompt = f"""Question: {query}

Context:
{json.dumps(relevant_paragraphs, indent=2)}

Instructions:
1. Answer the question based ONLY on the provided context
2. If the context doesn't contain enough information, say so
3. Include page numbers in your citations
4. Be concise but complete
5. Use markdown formatting for better readability

Answer:"""

            answer_response = self.client.chat.completions.create(
                model=self.model_name,
                messages=[
                    {"role": "system", "content": "You are a helpful AI assistant that answers questions based on provided context."},
                    {"role": "user", "content": answer_prompt}
                ],
                temperature=0.3,
                max_tokens=1000
            )
            
            answer = answer_response.choices[0].message.content.strip()
            
            # Calculate answer costs
            answer_costs = self._calculate_cost(
                self.model_name,
                answer_response.usage.prompt_tokens,
                answer_response.usage.completion_tokens
            )
            
            # Extract citations and relevant paragraphs
            citations = []
            for p in relevant_paragraphs:
                if isinstance(p, dict) and 'pages' in p:
                    for page in p['pages']:
                        citations.append({
                            "page": page,
                            "text": p.get('text', '')[:100] + '...'
                        })
            
            # Combine costs with proper structure for frontend
            costs = [
                {
                    "model": f"{reasoning_costs['model']} (Reasoning)",
                    "inputTokens": reasoning_response.usage.prompt_tokens,
                    "outputTokens": reasoning_response.usage.completion_tokens,
                    "totalTokens": reasoning_response.usage.total_tokens,
                    "inputCost": reasoning_costs["inputCost"],
                    "outputCost": reasoning_costs["outputCost"],
                    "totalCost": reasoning_costs["totalCost"],
                    # Legacy field names for compatibility
                    "input_tokens": reasoning_response.usage.prompt_tokens,
                    "output_tokens": reasoning_response.usage.completion_tokens,
                    "total_tokens": reasoning_response.usage.total_tokens,
                    "input_cost": reasoning_costs["inputCost"],
                    "output_cost": reasoning_costs["outputCost"],
                    "total_cost": reasoning_costs["totalCost"]
                },
                {
                    "model": f"{answer_costs['model']} (Answer)",
                    "inputTokens": answer_response.usage.prompt_tokens,
                    "outputTokens": answer_response.usage.completion_tokens,
                    "totalTokens": answer_response.usage.total_tokens,
                    "inputCost": answer_costs["inputCost"],
                    "outputCost": answer_costs["outputCost"],
                    "totalCost": answer_costs["totalCost"],
                    # Legacy field names for compatibility
                    "input_tokens": answer_response.usage.prompt_tokens,
                    "output_tokens": answer_response.usage.completion_tokens,
                    "total_tokens": answer_response.usage.total_tokens,
                    "input_cost": answer_costs["inputCost"],
                    "output_cost": answer_costs["outputCost"],
                    "total_cost": answer_costs["totalCost"]
                }
            ]
            
            # Calculate total usage
            total_usage = {
                "total_tokens": reasoning_response.usage.total_tokens + answer_response.usage.total_tokens,
                "answer_tokens": answer_response.usage.completion_tokens,
                "reasoning_tokens": reasoning_response.usage.completion_tokens
            }
            
            return {
                "answer": answer,
                "reasoning": reasoning,
                "citations": citations,
                "relevant_paragraphs": relevant_paragraphs,
                "costs": costs,
                "model": self.model_name,
                "usage": total_usage,
                "success": True,
                "timestamp": datetime.datetime.now().timestamp()
            }
            
        except Exception as e:
            self.logger.error(f"Error processing query: {str(e)}")
            return self._create_empty_response(
                "I apologize, but I encountered an error while processing your question.",
                f"Error: {str(e)}"
            )
    
    def _create_empty_response(self, answer: str, reasoning: str) -> Dict:
        """Create a properly structured empty response."""
        return {
            "answer": answer,
            "reasoning": reasoning,
            "citations": [],
            "relevant_paragraphs": [],
            "costs": [],
            "model": self.model_name,
            "usage": {
                "total_tokens": 0,
                "answer_tokens": 0,
                "reasoning_tokens": 0
            },
            "success": True,
            "timestamp": time.time()
        }
    
    def _create_error_response(self, error_message: str) -> Dict:
        """Create a properly structured error response."""
        return {
            "answer": "I apologize, but I encountered an error while processing your question. Please try again.",
            "reasoning": f"Error: {error_message}",
            "citations": [],
            "relevant_paragraphs": [],
            "costs": [],
            "model": self.model_name,
            "usage": {
                "total_tokens": 0,
                "answer_tokens": 0,
                "reasoning_tokens": 0
            },
            "success": False,
            "error": error_message,
            "timestamp": time.time()
        }
            
    async def analyze_text(self, 
                          text: str, 
                          analysis_type: str,
                          model: str = None) -> Dict:
        """Analyze text for specific purposes."""
        try:
            if model is None:
                model = self.settings.get("AZURE_OPENAI_DEPLOYMENT_MAIN")
            system_prompt = self._get_analysis_prompt(analysis_type)
            response = self.client.chat.completions.create(
                model=model,
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": text}
                ],
                temperature=0.5,
                max_tokens=1000
            )
            
            # Calculate token usage and cost
            prompt_tokens = response.usage.prompt_tokens
            completion_tokens = response.usage.completion_tokens
            total_tokens = response.usage.total_tokens
            
            # Calculate cost (assuming $0.002 per 1K tokens for input and $0.002 per 1K tokens for output)
            input_cost = (prompt_tokens / 1000) * 0.002
            output_cost = (completion_tokens / 1000) * 0.002
            total_cost = input_cost + output_cost
            
            return {
                "analysis": response.choices[0].message.content,
                "type": analysis_type,
                "model": model,
                "usage": {
                    "prompt_tokens": prompt_tokens,
                    "completion_tokens": completion_tokens,
                    "total_tokens": total_tokens
                },
                "cost": {
                    "input_cost": round(input_cost, 6),
                    "output_cost": round(output_cost, 6),
                    "total_cost": round(total_cost, 6)
                }
            }
        except Exception as e:
            self.logger.error(f"Error analyzing text: {str(e)}")
            raise
            
    def _get_analysis_prompt(self, analysis_type: str) -> str:
        """Get the appropriate system prompt for the analysis type."""
        prompts = {
            "summary": "Summarize the following text concisely:",
            "key_points": "Extract the key points from the following text:",
            "sentiment": "Analyze the sentiment of the following text:",
            "qa": "Answer questions about the following text:"
        }
        return prompts.get(analysis_type, "Analyze the following text:")

    def _get_relevant_paragraphs(self, question: str, pdf_content: str = None) -> list:
        """Find relevant paragraphs for a question using advanced logic from new_search.py."""
        if not pdf_content:
            self.logger.warning("No PDF content provided")
            return []
        try:
            self.logger.info(f"Processing question: {question}")
            self.logger.info(f"PDF content length: {len(pdf_content)} characters")
            # Log the first 500 characters of the content to verify it's being loaded correctly
            self.logger.info(f"First 500 characters of content: {pdf_content[:500]}")

            # Chunk the PDF content into a list of dicts
            chunks = split_into_50_chunks(pdf_content, min_tokens=500)
            result = navigate_to_paragraphs(question, chunks, depth=0)
            paragraphs = result if isinstance(result, list) else result.get('paragraphs', [])

            if not paragraphs:
                self.logger.warning("No relevant paragraphs found")
                return []  # Return empty list instead of default message

            self.logger.info(f"Found {len(paragraphs)} relevant paragraphs")
            # Log the first paragraph to verify content
            if paragraphs:
                self.logger.info(f"First paragraph content: {paragraphs[0].get('text', '')[:200]}")
            return paragraphs
        except Exception as e:
            self.logger.error(f"Error in _get_relevant_paragraphs: {str(e)}")
            self.logger.exception("Full traceback:")
            return []

    def route_question(self, question: str, paragraphs: list) -> list:
        """
        Dummy implementation: Selects all paragraph IDs.
        Replace with your actual logic to select relevant paragraphs.
        """
        return [p.get('id') for p in paragraphs if 'id' in p]
