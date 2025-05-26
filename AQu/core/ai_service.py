import os
import logging
from typing import Dict, List, Optional
import openai
from openai import AzureOpenAI
from config.settings import Settings
from new_search import navigate_to_paragraphs, generate_answer

class AIService:
    def __init__(self):
        self.logger = logging.getLogger(__name__)
        self.settings = Settings()
        self.logger.info(f"Settings loaded: {self.settings.config}")
        self.client = self._initialize_client()
        
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
                azure_endpoint=azure_endpoint
            )
        except Exception as e:
            self.logger.error(f"Error initializing Azure OpenAI client: {str(e)}")
            raise
            
    async def process_query(self, 
                          query: str, 
                          context: str, 
                          model: str = "ai-4.1-mini") -> Dict:
        """Process a query using the AI model."""
        try:
            # First, get relevant paragraphs and reasoning
            navigation_result = navigate_to_paragraphs(context, query)
            paragraphs = navigation_result["paragraphs"]
            reasoning = navigation_result["scratchpad"]

            # Generate answer using the relevant paragraphs
            answer_result = generate_answer(query, paragraphs, reasoning)
            
            # Get the response from the model
            response = self.client.chat.completions.create(
                model=model,
                messages=[
                    {"role": "system", "content": "You are a helpful AI assistant."},
                    {"role": "user", "content": f"Context: {context}\n\nQuery: {query}"}
                ],
                temperature=0.7,
                max_tokens=800
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
                "answer": answer_result.answer,
                "reasoning": reasoning,
                "relevant_paragraphs": paragraphs,
                "citations": answer_result.citations,
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
            self.logger.error(f"Error processing query: {str(e)}")
            raise
            
    async def analyze_text(self, 
                          text: str, 
                          analysis_type: str,
                          model: str = "ai-4.1-mini") -> Dict:
        """Analyze text for specific purposes."""
        try:
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
