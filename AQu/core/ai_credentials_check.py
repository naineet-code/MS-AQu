"""
AI Credentials Check Module
Tests Azure OpenAI API connectivity and model availability
"""

import logging
from typing import Dict, Any
from openai import AzureOpenAI
import httpx
from config.settings import Settings
from config.logging_config import get_logger
import time

logger = get_logger(__name__)

class AICredentialsChecker:
    def __init__(self):
        self.settings = Settings()
        self.model_functions = {
            "mini": ["Question Routing", "Basic Tasks", "Answer Generation", "Reasoning"],
            "main": ["Complex Answer Generation", "Text Analysis"],
            "nano": ["Answer Verification", "Quick Validation"]
        }
    
    def _create_client(self, model_type: str) -> tuple[AzureOpenAI, Dict[str, str]]:
        """Create Azure OpenAI client for a specific model type."""
        try:
            if model_type == "mini":
                api_key = self.settings.get("AZURE_OPENAI_API_KEY_MINI", "").strip()
                endpoint = self.settings.get("AZURE_OPENAI_ENDPOINT_MINI", "").strip()
                api_version = self.settings.get("AZURE_OPENAI_API_VERSION_MINI", "").strip()
                deployment = self.settings.get("AZURE_OPENAI_DEPLOYMENT_MINI", "").strip()
            elif model_type == "main":
                api_key = self.settings.get("AZURE_OPENAI_API_KEY_MAIN", "").strip()
                endpoint = self.settings.get("AZURE_OPENAI_ENDPOINT_MAIN", "").strip()
                api_version = self.settings.get("AZURE_OPENAI_API_VERSION_MAIN", "").strip()
                deployment = self.settings.get("AZURE_OPENAI_DEPLOYMENT_MAIN", "").strip()
            elif model_type == "nano":
                api_key = self.settings.get("AZURE_OPENAI_API_KEY_NANO", "").strip()
                endpoint = self.settings.get("AZURE_OPENAI_ENDPOINT_NANO", "").strip()
                api_version = self.settings.get("AZURE_OPENAI_API_VERSION_NANO", "").strip()
                deployment = self.settings.get("AZURE_OPENAI_DEPLOYMENT_NANO", "").strip()
            else:
                raise ValueError(f"Unknown model type: {model_type}")
            
            config = {
                "api_key": api_key,
                "endpoint": endpoint,
                "api_version": api_version,
                "deployment": deployment
            }
            
            client = AzureOpenAI(
                api_key=api_key,
                api_version=api_version,
                azure_endpoint=endpoint,
                http_client=httpx.Client(timeout=10.0)
            )
            
            return client, config
        except Exception as e:
            logger.error(f"Error creating client for {model_type}: {str(e)}")
            raise
    
    def test_model_connectivity(self, model_type: str) -> Dict[str, Any]:
        """Test connectivity and functionality for a specific model."""
        try:
            client, config = self._create_client(model_type)
            
            # Test with a simple prompt
            start_time = time.time()
            response = client.chat.completions.create(
                model=config["deployment"],
                messages=[
                    {"role": "system", "content": "You are a helpful AI assistant."},
                    {"role": "user", "content": "Hello! Please respond with 'API test successful'"}
                ],
                max_tokens=50,
                temperature=0.1
            )
            response_time = time.time() - start_time
            
            return {
                "status": "✅ Connected",
                "model_name": config["deployment"],
                "endpoint": config["endpoint"],
                "api_version": config["api_version"],
                "response_time_ms": round(response_time * 1000, 2),
                "test_response": response.choices[0].message.content.strip(),
                "functions": self.model_functions.get(model_type, []),
                "error": None
            }
        except Exception as e:
            logger.error(f"Error testing {model_type} model: {str(e)}")
            return {
                "status": "❌ Failed",
                "model_name": config.get("deployment", "Unknown") if 'config' in locals() else "Unknown",
                "endpoint": config.get("endpoint", "Unknown") if 'config' in locals() else "Unknown",
                "api_version": config.get("api_version", "Unknown") if 'config' in locals() else "Unknown",
                "response_time_ms": 0,
                "test_response": None,
                "functions": self.model_functions.get(model_type, []),
                "error": str(e)
            }
    
    def check_all_credentials(self) -> Dict[str, Any]:
        """Check all AI model credentials and connectivity."""
        results = {}
        overall_status = "✅ All Systems Operational"
        
        for model_type in ["mini", "main", "nano"]:
            try:
                results[model_type] = self.test_model_connectivity(model_type)
                if "Failed" in results[model_type]["status"]:
                    overall_status = "⚠️ Some Issues Detected"
            except Exception as e:
                logger.error(f"Error checking {model_type}: {str(e)}")
                results[model_type] = {
                    "status": "❌ Failed",
                    "model_name": "Unknown",
                    "endpoint": "Unknown",
                    "api_version": "Unknown",
                    "response_time_ms": 0,
                    "test_response": None,
                    "functions": self.model_functions.get(model_type, []),
                    "error": str(e)
                }
                overall_status = "⚠️ Some Issues Detected"
        
        return {
            "overall_status": overall_status,
            "models": results,
            "timestamp": time.time()
        }

# Global instance
ai_credentials_checker = AICredentialsChecker() 