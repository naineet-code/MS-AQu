import os
import logging
from typing import Dict, List, Optional
import openai
from openai import AzureOpenAI

class AIService:
    def __init__(self):
        self.logger = logging.getLogger(__name__)
        self.client = self._initialize_client()
        
    def _initialize_client(self) -> AzureOpenAI:
        """Initialize the Azure OpenAI client."""
        try:
            return AzureOpenAI(
                api_key=os.getenv("AZURE_OPENAI_API_KEY"),
                api_version=os.getenv("AZURE_OPENAI_API_VERSION", "2024-02-15-preview"),
                azure_endpoint=os.getenv("AZURE_OPENAI_ENDPOINT")
            )
        except Exception as e:
            self.logger.error(f"Error initializing Azure OpenAI client: {str(e)}")
            raise
            
    async def process_query(self, 
                          query: str, 
                          context: str, 
                          model: str = "gpt-4-1106-preview") -> Dict:
        """Process a query using the AI model."""
        try:
            response = await self.client.chat.completions.create(
                model=model,
                messages=[
                    {"role": "system", "content": "You are a helpful AI assistant."},
                    {"role": "user", "content": f"Context: {context}\n\nQuery: {query}"}
                ],
                temperature=0.7,
                max_tokens=800
            )
            
            return {
                "answer": response.choices[0].message.content,
                "model": model,
                "usage": response.usage
            }
        except Exception as e:
            self.logger.error(f"Error processing query: {str(e)}")
            raise
            
    async def analyze_text(self, 
                          text: str, 
                          analysis_type: str,
                          model: str = "gpt-4-1106-preview") -> Dict:
        """Analyze text for specific purposes."""
        try:
            system_prompt = self._get_analysis_prompt(analysis_type)
            response = await self.client.chat.completions.create(
                model=model,
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": text}
                ],
                temperature=0.5,
                max_tokens=1000
            )
            
            return {
                "analysis": response.choices[0].message.content,
                "type": analysis_type,
                "model": model
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