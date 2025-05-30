# 🔐 Azure OpenAI Credentials Setup Guide

## Overview
The FAQ and Reasoning Chatbot now uses a **TOML-based credentials system** for better security and organization. All Azure OpenAI credentials are stored in the `cred.toml` file.

## ✅ What's Fixed
- **No more environment variable errors**: The system now uses TOML configuration
- **Lazy client initialization**: Clients are only created when needed
- **Better error handling**: Clear error messages for missing credentials
- **Organized configuration**: All credentials in one structured file

## 🚀 Quick Setup

### 1. Update Your Credentials
Edit the `AQu/cred.toml` file and replace the placeholder values with your actual Azure OpenAI credentials:

```toml
# Azure OpenAI Credentials Configuration
[azure_openai]

# Mini Model Configuration (GPT-4.1-mini for routing and basic tasks)
[azure_openai.mini]
api_key = "YOUR_ACTUAL_API_KEY_MINI"
endpoint = "https://your-actual-resource-mini.openai.azure.com/"
api_version = "2024-02-15-preview"
deployment_name = "your-actual-deployment-name-mini"

# Main Model Configuration (GPT-4.1 for answer generation)
[azure_openai.main]
api_key = "YOUR_ACTUAL_API_KEY_MAIN"
endpoint = "https://your-actual-resource-main.openai.azure.com/"
api_version = "2024-02-15-preview"
deployment_name = "your-actual-deployment-name-main"

# Nano Model Configuration (GPT-4.1-nano for verification)
[azure_openai.nano]
api_key = "YOUR_ACTUAL_API_KEY_NANO"
endpoint = "https://your-actual-resource-nano.openai.azure.com/"
api_version = "2024-02-15-preview"
deployment_name = "your-actual-deployment-name-nano"
```

### 2. Start the Backend
```bash
cd /home/azureuser/faqu-reliance/AQu
python3 app.py
```

### 3. Test the System
```bash
# Test if backend is running
curl http://localhost:8000/

# Test the FAQ endpoint
curl -X POST "http://localhost:8000/api/query?query=What%20is%20WSSI&category=reliance" -H "Content-Type: application/json"
```

## 🔧 Configuration Details

### Required Fields for Each Model
- **api_key**: Your Azure OpenAI API key
- **endpoint**: Your Azure OpenAI endpoint URL
- **api_version**: API version (recommended: "2024-02-15-preview")
- **deployment_name**: Your model deployment name in Azure

### Model Usage
- **Mini Model**: GPT-4.1 Mini - Used for routing and reasoning (cost-effective)
- **Main Model**: GPT-4.1 (Flagship) - Used for generating detailed answers (high quality)
- **Nano Model**: GPT-4.1 Nano - Used for verification and validation (fast responses)

## 🎯 Benefits of the New System

### 1. **Complete Data Structure**
The backend now provides all fields the frontend expects:
```json
{
  "answer": "Rich markdown-formatted answer",
  "reasoning": "Detailed AI reasoning process",
  "citations": [{"page": 1, "text": "excerpt..."}],
  "relevant_paragraphs": [{"text": "full text", "page": [1,2]}],
  "costs": [
    {
      "model": "GPT-4.1 Mini",
      "operation": "reasoning",
      "input_tokens": 1500,
      "output_tokens": 200,
      "input_cost": 0.000225,
      "output_cost": 0.00012,
      "total_cost": 0.000345
    }
  ],
  "models": {
    "reasoning": "GPT-4.1 Mini",
    "answer": "GPT-4.1",
    "verification": "GPT-4.1 Nano"
  },
  "usage": {"total_tokens": 1700, "prompt_tokens": 1500, "completion_tokens": 200},
  "success": true,
  "timestamp": 1703123456.789
}
```

### 2. **Robust Error Handling**
- Graceful fallbacks for missing data
- Comprehensive null checks in frontend
- Clear error messages for debugging

### 3. **Cost Tracking**
- Detailed cost breakdown per model
- Token usage tracking
- Real-time cost calculation

## 💸 Cost Calculation & Transparency

- The backend calculates the true cost for every AI model used in a response using GPT-4.1 family pricing
- All models (mini, main, nano) are tracked with detailed pricing from config/config.json
- The API response includes a costs array with breakdown for each model operation
- Cache operations (verification) are included in cost calculations
- The frontend displays total cost and detailed breakdown per model operation
- Model pricing is kept up-to-date for full transparency

### Current GPT-4.1 Pricing (Azure OpenAI):

**GPT-4.1 Mini**
- Global Deployment:
  - Input: $0.00015 / 1,000 tokens
  - Output: $0.0006 / 1,000 tokens
- Regional Deployment:
  - Input: $0.000165 / 1,000 tokens
  - Output: $0.00066 / 1,000 tokens

**GPT-4.1 Features:**
- 💸 Cost-Efficient: Lower price point than previous models
- ⚡ High Performance: 82% on MMLU benchmark (vs GPT-3.5 Turbo at 70%)
- 🌍 Flexible Deployment: Supports both global and regional use cases

## 🔍 Troubleshooting

### Common Issues

1. **"Credentials file not found"**
   - Ensure `cred.toml` exists in the `AQu/` directory
   - Check file permissions

2. **"Missing required field"**
   - Verify all required fields are present in `cred.toml`
   - Check for typos in field names

3. **"Placeholder values detected"**
   - Replace all `your_` placeholder values with actual credentials
   - Ensure endpoints don't contain `your-resource`

4. **"API key format invalid"**
   - Azure OpenAI keys should start with a specific format
   - Verify you're using the correct API key

### Validation
The system automatically validates credentials on startup:
- Checks for required fields
- Validates API key format
- Verifies endpoint format
- Detects placeholder values

## 📝 Example Working Configuration

```toml
[azure_openai]

[azure_openai.mini]
api_key = "sk-abc123def456ghi789jkl012mno345pqr678stu901vwx234yz"
endpoint = "https://my-openai-east.openai.azure.com/"
api_version = "2024-02-15-preview"
deployment_name = "gpt-4.1-mini-deployment"

[azure_openai.main]
api_key = "sk-xyz987wvu654tsr321qpo098nml765kji432hgf210edc098ba"
endpoint = "https://my-openai-west.openai.azure.com/"
api_version = "2024-02-15-preview"
deployment_name = "gpt-4.1-deployment"

[azure_openai.nano]
api_key = "sk-mno345pqr678stu901vwx234yz567abc123def456ghi789jkl"
endpoint = "https://my-openai-central.openai.azure.com/"
api_version = "2024-02-15-preview"
deployment_name = "gpt-4.1-nano-deployment"
```

## 🎉 Success Indicators

When everything is working correctly, you should see:
1. Backend starts without errors
2. Credentials load successfully (check logs)
3. API endpoints respond with complete data
4. Frontend displays rich responses with citations and costs
5. No null/undefined errors in browser console

## 📞 Support

If you encounter issues:
1. Check the backend logs for detailed error messages
2. Verify your Azure OpenAI credentials are correct
3. Ensure all three models (mini, main, nano) are properly configured
4. Test each endpoint individually to isolate issues

---

**The system is now ready to provide awesome FAQ responses with complete data structures!** 🚀 