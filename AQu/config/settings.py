import os
from pathlib import Path
from typing import Dict, Any
import json
import logging
from .credentials import get_credentials_manager

class Settings:
    def __init__(self):
        self.logger = logging.getLogger(__name__)
        self.base_dir = Path(__file__).parent.parent
        self.config: Dict[str, Any] = {}
        self._load_config()
        
    def _load_config(self) -> None:
        """Load configuration from TOML file and config files."""
        try:
            # Get credentials manager
            creds_manager = get_credentials_manager()
            
            # Log TOML configuration loading
            self.logger.info("Loading configuration from TOML file:")
            
            # Load Azure OpenAI configurations from TOML
            try:
                mini_config = creds_manager.get_azure_config('mini')
                main_config = creds_manager.get_azure_config('main')
                nano_config = creds_manager.get_azure_config('nano')
                app_config = creds_manager.get_app_config()
                
                self.logger.info(f"Mini model endpoint: {mini_config['endpoint']}")
                self.logger.info(f"Main model endpoint: {main_config['endpoint']}")
                self.logger.info(f"Nano model endpoint: {nano_config['endpoint']}")
                
                # Update config with TOML values
                self.config.update({
                    "AZURE_OPENAI_API_KEY_MINI": mini_config['api_key'],
                    "AZURE_OPENAI_API_VERSION_MINI": mini_config['api_version'],
                    "AZURE_OPENAI_ENDPOINT_MINI": mini_config['endpoint'],
                    "AZURE_OPENAI_DEPLOYMENT_MINI": mini_config['deployment_name'],
                    
                    "AZURE_OPENAI_API_KEY_MAIN": main_config['api_key'],
                    "AZURE_OPENAI_API_VERSION_MAIN": main_config['api_version'],
                    "AZURE_OPENAI_ENDPOINT_MAIN": main_config['endpoint'],
                    "AZURE_OPENAI_DEPLOYMENT_MAIN": main_config['deployment_name'],
                    
                    "AZURE_OPENAI_API_KEY_NANO": nano_config['api_key'],
                    "AZURE_OPENAI_API_VERSION_NANO": nano_config['api_version'],
                    "AZURE_OPENAI_ENDPOINT_NANO": nano_config['endpoint'],
                    "AZURE_OPENAI_DEPLOYMENT_NANO": nano_config['deployment_name'],
                    
                    # App configuration
                    "PDF_DIR": app_config.get("pdf_dir", str(self.base_dir / "static/pdfs")),
                    "LOG_LEVEL": app_config.get("log_level", "INFO"),
                    "BACKEND_URL": app_config.get("backend_url", "http://localhost:8000"),
                    
                    # Default model settings
                    "MODEL_NAME": "gpt-4-1106-preview",
                    "MAX_TOKENS": 800,
                    "TEMPERATURE": 0.7
                })
                
            except Exception as e:
                self.logger.error(f"Error loading TOML configuration: {str(e)}")
                # Fallback to environment variables if TOML fails
                self.logger.warning("Falling back to environment variables")
                self.config.update({
                    "AZURE_OPENAI_API_KEY_MINI": os.getenv("AZURE_OPENAI_API_KEY_MINI"),
                    "AZURE_OPENAI_API_VERSION_MINI": os.getenv("AZURE_OPENAI_API_VERSION_MINI", "2024-02-15-preview"),
                    "AZURE_OPENAI_ENDPOINT_MINI": os.getenv("AZURE_OPENAI_ENDPOINT_MINI"),
                    "AZURE_OPENAI_API_KEY_NANO": os.getenv("AZURE_OPENAI_API_KEY_NANO"),
                    "AZURE_OPENAI_API_VERSION_NANO": os.getenv("AZURE_OPENAI_API_VERSION_NANO", "2024-02-15-preview"),
                    "AZURE_OPENAI_ENDPOINT_NANO": os.getenv("AZURE_OPENAI_ENDPOINT_NANO"),
                    "PDF_DIR": os.getenv("PDF_DIR", str(self.base_dir / "static/pdfs")),
                    "LOG_LEVEL": os.getenv("LOG_LEVEL", "INFO"),
                    "MODEL_NAME": os.getenv("MODEL_NAME", "gpt-4-1106-preview"),
                    "MAX_TOKENS": int(os.getenv("MAX_TOKENS", "800")),
                    "TEMPERATURE": float(os.getenv("TEMPERATURE", "0.7"))
                })
            
            # Log loaded configuration (without sensitive data)
            self.logger.info("Configuration loaded:")
            self.logger.info(f"Mini model API key: {self.config['AZURE_OPENAI_API_KEY_MINI'][:8] if self.config['AZURE_OPENAI_API_KEY_MINI'] else 'Not set'}...")
            self.logger.info(f"Mini model endpoint: {self.config['AZURE_OPENAI_ENDPOINT_MINI']}")
            self.logger.info(f"Mini model API version: {self.config['AZURE_OPENAI_API_VERSION_MINI']}")
            self.logger.info(f"PDF directory: {self.config['PDF_DIR']}")
            self.logger.info(f"Log level: {self.config['LOG_LEVEL']}")
            
            # Load additional config from file if exists
            config_file = self.base_dir / "config" / "config.json"
            if config_file.exists():
                with open(config_file) as f:
                    additional_config = json.load(f)
                    self.config.update(additional_config)
                    self.logger.info("Additional configuration loaded from config.json")
                    
            self.logger.info("Configuration loaded successfully")
        except Exception as e:
            self.logger.error(f"Error loading configuration: {str(e)}")
            raise
            
    def get(self, key: str, default: Any = None) -> Any:
        """Get a configuration value."""
        return self.config.get(key, default)
        
    def set(self, key: str, value: Any) -> None:
        """Set a configuration value."""
        self.config[key] = value
        
    def save(self) -> None:
        """Save configuration to file."""
        try:
            config_file = self.base_dir / "config" / "config.json"
            # Only save non-sensitive configuration to JSON
            safe_config = {k: v for k, v in self.config.items() 
                          if not k.startswith('AZURE_OPENAI_API_KEY')}
            with open(config_file, 'w') as f:
                json.dump(safe_config, f, indent=4)
            self.logger.info("Configuration saved successfully")
        except Exception as e:
            self.logger.error(f"Error saving configuration: {str(e)}")
            raise
            
    def validate(self) -> bool:
        """Validate the configuration."""
        required_keys = [
            "AZURE_OPENAI_API_KEY_MINI",
            "AZURE_OPENAI_ENDPOINT_MINI",
            "AZURE_OPENAI_API_VERSION_MINI"
        ]
        
        missing_keys = [key for key in required_keys if not self.config.get(key)]
        if missing_keys:
            self.logger.error(f"Missing required configuration keys: {missing_keys}")
            return False
        
        # Validate that credentials are not placeholder values
        try:
            creds_manager = get_credentials_manager()
            if not creds_manager.validate_credentials():
                self.logger.error("Credential validation failed - please check your cred.toml file")
                return False
        except Exception as e:
            self.logger.error(f"Error validating credentials: {str(e)}")
            return False
            
        return True 