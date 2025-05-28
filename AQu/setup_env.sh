#!/bin/bash

# Setup script for AQu Backend Environment
echo "🚀 Setting up AQu Backend Environment"
echo "======================================"

# Check if .env file exists
if [ -f ".env" ]; then
    echo "✅ .env file already exists"
    echo "📝 Please update the following variables with your Azure OpenAI credentials:"
    echo ""
    echo "Required variables:"
    echo "- AZURE_OPENAI_API_KEY_MINI"
    echo "- AZURE_OPENAI_ENDPOINT_MINI" 
    echo "- AZURE_OPENAI_API_KEY_MAIN"
    echo "- AZURE_OPENAI_ENDPOINT_MAIN"
    echo "- AZURE_OPENAI_API_KEY_NANO"
    echo "- AZURE_OPENAI_ENDPOINT_NANO"
    echo ""
else
    echo "📄 Creating .env file from template..."
    cp sample.env .env
    
    cat >> .env << 'EOF'

# Azure OpenAI Configuration for Mini Model (GPT-4.1-mini)
AZURE_OPENAI_API_KEY_MINI=your_azure_openai_api_key_mini
AZURE_OPENAI_ENDPOINT_MINI=https://your-resource-mini.openai.azure.com/
AZURE_OPENAI_API_VERSION_MINI=2024-02-15-preview
AZURE_OPENAI_DEPLOYMENT_MINI=gpt-4-mini

# Azure OpenAI Configuration for Main Model (GPT-4.1)
AZURE_OPENAI_API_KEY_MAIN=your_azure_openai_api_key_main
AZURE_OPENAI_ENDPOINT_MAIN=https://your-resource-main.openai.azure.com/
AZURE_OPENAI_API_VERSION_MAIN=2024-02-15-preview
AZURE_OPENAI_DEPLOYMENT_MAIN=gpt-4

# Azure OpenAI Configuration for Nano Model (GPT-4.1-nano)
AZURE_OPENAI_API_KEY_NANO=your_azure_openai_api_key_nano
AZURE_OPENAI_ENDPOINT_NANO=https://your-resource-nano.openai.azure.com/
AZURE_OPENAI_API_VERSION_NANO=2024-02-15-preview
AZURE_OPENAI_DEPLOYMENT_NANO=gpt-4-nano

# Legacy environment variables for backward compatibility
AZURE_OPENAI_API_KEY=your_azure_openai_api_key_mini
AZURE_OPENAI_ENDPOINT=https://your-resource-mini.openai.azure.com/
AZURE_OPENAI_API_VERSION=2024-02-15-preview

# Deployment names for the new RAG endpoints
AZURE_DEPLOYMENT_NAME_MINI=gpt-4-mini
AZURE_DEPLOYMENT_NAME_MAIN=gpt-4
AZURE_DEPLOYMENT_NAME_NANO=gpt-4-nano

# Application Configuration
PDF_DIR=static/pdfs
LOG_LEVEL=INFO
EOF

    echo "✅ .env file created successfully!"
    echo ""
fi

echo "🔧 Next Steps:"
echo "1. Edit .env file with your Azure OpenAI credentials"
echo "2. Run: python3 app.py"
echo "3. Test: curl http://localhost:8000/"
echo ""
echo "📚 For detailed setup instructions, see: FRONTEND_BACKEND_INTEGRATION.md"
echo ""
echo "🎯 Example .env configuration:"
echo "AZURE_OPENAI_API_KEY_MINI=abc123..."
echo "AZURE_OPENAI_ENDPOINT_MINI=https://your-resource.openai.azure.com/"
echo ""
echo "Happy coding! 🚀" 