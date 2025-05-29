"""
Credentials management for Azure OpenAI services.
Loads credentials from cred.toml file.
"""

import os
import toml
import logging
from typing import Dict, Any, Optional
from pathlib import Path

logger = logging.getLogger(__name__)

class CredentialsManager:
    """Manages Azure OpenAI credentials from TOML configuration."""
    
    def __init__(self, config_file: str = "cred.toml"):
        self.config_file = config_file
        self.config_path = Path(__file__).parent.parent / config_file
        self._credentials = None
        self._load_credentials()
    
    def _load_credentials(self) -> None:
        """Load credentials from TOML file."""
        try:
            if not self.config_path.exists():
                logger.error(f"Credentials file not found: {self.config_path}")
                raise FileNotFoundError(f"Credentials file not found: {self.config_path}")
            
            with open(self.config_path, 'r') as f:
                self._credentials = toml.load(f)
            
            logger.info("Credentials loaded successfully from cred.toml")
            
            # Validate required sections
            if 'azure_openai' not in self._credentials:
                raise ValueError("Missing 'azure_openai' section in credentials file")
            
            # Log loaded configurations (without sensitive data)
            azure_config = self._credentials['azure_openai']
            for model_type in ['mini', 'main', 'nano']:
                if model_type in azure_config:
                    endpoint = azure_config[model_type].get('endpoint', 'Not set')
                    deployment = azure_config[model_type].get('deployment_name', 'Not set')
                    logger.info(f"Loaded {model_type} model config - Endpoint: {endpoint}, Deployment: {deployment}")
                else:
                    logger.warning(f"Missing {model_type} model configuration")
                    
        except Exception as e:
            logger.error(f"Error loading credentials: {str(e)}")
            raise
    
    def get_azure_config(self, model_type: str) -> Dict[str, str]:
        """
        Get Azure OpenAI configuration for a specific model type.
        
        Args:
            model_type: One of 'mini', 'main', 'nano'
            
        Returns:
            Dictionary with api_key, endpoint, api_version, deployment_name
        """
        if not self._credentials:
            raise ValueError("Credentials not loaded")
        
        azure_config = self._credentials.get('azure_openai', {})
        model_config = azure_config.get(model_type)
        
        if not model_config:
            raise ValueError(f"No configuration found for model type: {model_type}")
        
        required_fields = ['api_key', 'endpoint', 'api_version', 'deployment_name']
        for field in required_fields:
            if not model_config.get(field):
                raise ValueError(f"Missing required field '{field}' for {model_type} model")
        
        return {
            'api_key': model_config['api_key'],
            'endpoint': model_config['endpoint'],
            'api_version': model_config['api_version'],
            'deployment_name': model_config['deployment_name']
        }
    
    def get_app_config(self) -> Dict[str, Any]:
        """Get application configuration."""
        if not self._credentials:
            raise ValueError("Credentials not loaded")
        
        return self._credentials.get('app', {})
    
    def validate_credentials(self) -> bool:
        """
        Validate that all required credentials are present and properly formatted.
        
        Returns:
            True if all credentials are valid, False otherwise
        """
        try:
            for model_type in ['mini', 'main', 'nano']:
                config = self.get_azure_config(model_type)
                
                # Check API key format
                if not config['api_key'] or len(config['api_key']) < 32:
                    logger.warning(f"API key for {model_type} model may be invalid format - should be at least 32 characters")
                
                # Check endpoint format
                if not config['endpoint'].startswith('https://'):
                    logger.warning(f"Endpoint for {model_type} model should start with https://")
                
                # Check if using placeholder values
                if 'your_' in config['api_key'] or 'your-resource' in config['endpoint']:
                    logger.warning(f"Placeholder values detected for {model_type} model - please update with real credentials")
                    return False
            
            logger.info("All credentials validated successfully")
            return True
            
        except Exception as e:
            logger.error(f"Credential validation failed: {str(e)}")
            return False
    
    def reload_credentials(self) -> None:
        """Reload credentials from file."""
        logger.info("Reloading credentials...")
        self._load_credentials()

# Global credentials manager instance
_credentials_manager = None

def get_credentials_manager() -> CredentialsManager:
    """Get the global credentials manager instance."""
    global _credentials_manager
    if _credentials_manager is None:
        _credentials_manager = CredentialsManager()
    return _credentials_manager

def get_azure_config(model_type: str) -> Dict[str, str]:
    """Convenience function to get Azure config for a model type."""
    return get_credentials_manager().get_azure_config(model_type)

def validate_all_credentials() -> bool:
    """Convenience function to validate all credentials."""
    return get_credentials_manager().validate_credentials() 