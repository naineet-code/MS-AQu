# AQu - AI Question Answering System

AQu is a unified backend service that provides AI-powered question answering capabilities for both Reliance and Merchandising frontends. It uses Azure OpenAI to process queries and provides rich text formatting in responses.

## Features

- PDF document management and caching
- AI-powered question answering
- Rich text response formatting
- Support for multiple frontends
- Configurable logging
- Environment-based configuration

## Project Structure

```
AQu/
├── api/                    # API endpoints
├── core/                   # Core functionality
│   ├── pdf_manager.py     # PDF handling and caching
│   ├── ai_service.py      # AI service integration
│   └── cache.py          # Caching utilities
├── static/
│   └── pdfs/             # PDF storage
│       ├── reliance/     # Reliance PDFs
│       └── merchandising/# Merchandising PDFs
├── config/               # Configuration files
├── logs/                # Log files
└── tests/              # Test files
```

## Setup

1. Create a virtual environment:
```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

2. Install dependencies:
```bash
pip install -r requirements.txt
```

3. Configure environment variables:
```bash
cp sample.env .env
# Edit .env with your configuration
```

Required environment variables:
- `AZURE_OPENAI_API_KEY`: Your Azure OpenAI API key
- `AZURE_OPENAI_ENDPOINT`: Your Azure OpenAI endpoint
- `AZURE_OPENAI_API_VERSION`: API version (default: 2024-02-15-preview)
- `PDF_DIR`: Directory for PDF storage (default: static/pdfs)
- `LOG_LEVEL`: Logging level (default: INFO)

## Running the Application

1. Start the server:
```bash
python app.py
```

The server will start on http://localhost:8000

## API Endpoints

### Query Processing
- `POST /api/query`: Process a question against PDF content
  ```json
  {
    "query": "Your question here",
    "category": "reliance|merchandising",
    "pdf_name": "optional_specific_pdf.pdf"
  }
  ```

### Text Analysis
- `POST /api/analyze`: Analyze text using AI
  ```json
  {
    "text": "Text to analyze",
    "analysis_type": "summary|key_points|sentiment|qa"
  }
  ```

### PDF Management
- `GET /api/pdfs`: List available PDFs
- `POST /api/refresh-pdfs`: Refresh PDF cache

## Frontend Integration

### Reliance Frontend
- Update API endpoint in `config.ts`
- Ensure PDFs are in `static/pdfs/reliance/`

### Merchandising Frontend
- Update API endpoint in `config.ts`
- Ensure PDFs are in `static/pdfs/merchandising/`

## Logging

Logs are stored in the `logs` directory with daily rotation. Each log file includes:
- Timestamp
- Log level
- Module name
- Message

## Development

1. Create a new branch for changes
2. Make your changes
3. Run tests
4. Submit a pull request

## Deployment

1. Update environment variables
2. Build and deploy the application
3. Ensure PDFs are in the correct directories
4. Monitor logs for any issues

## Troubleshooting

1. Check logs in `logs/` directory
2. Verify environment variables
3. Ensure PDFs are properly formatted
4. Check API key and endpoint configuration

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## License

This project is proprietary and confidential.

## Cost Calculation & Transparency

- The backend calculates the true cost for every AI model used in a response (e.g., mini, main, nano) using the latest rates from config/config.json.
- The API response includes a costs array, with a breakdown for each model (model name, input/output/total tokens, and costs).
- The frontend aggregates and displays the total cost incurred for the response, as well as a detailed breakdown per model.
- Model pricing is always fetched from the backend and is kept up-to-date for full transparency. 