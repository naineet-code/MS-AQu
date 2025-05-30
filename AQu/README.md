# AQu Backend Technical Guide

## Table of Contents
1.  [Introduction](#1-introduction)
    *   [1.1. Project Overview](#11-project-overview)
    *   [1.2. Architecture Overview](#12-architecture-overview)
2.  [Core Backend Technologies](#2-core-backend-technologies)
    *   [2.1. Redis Caching System (`SmartCacheManager`)](#21-redis-caching-system-smartcachemanager)
    *   [2.2. Retrieval-Augmented Generation (RAG) System](#22-retrieval-augmented-generation-rag-system)
    *   [2.3. NLTK (Natural Language Toolkit) Implementation](#23-nltk-natural-language-toolkit-implementation)
3.  [API Endpoints](#3-api-endpoints)
    *   [3.1. Main Query Processing](#31-main-query-processing)
    *   [3.2. Document Management](#32-document-management)
    *   [3.3. System Status and Administration](#33-system-status-and-administration)
    *   [3.4. PDF Serving (Static Files)](#34-pdf-serving-static-files)
4.  [System Setup, Configuration, and Deployment](#4-system-setup-configuration-and-deployment)
    *   [4.1. Prerequisites](#41-prerequisites)
    *   [4.2. Initial Setup Steps](#42-initial-setup-steps)
    *   [4.3. Configuration (`.env` file & `config/settings.py`)](#43-configuration-env-file--configsettingspy)
    *   [4.4. PDF Document Structure](#44-pdf-document-structure)
    *   [4.5. Running the Application Locally](#45-running-the-application-locally)
    *   [4.6. Deployment (General Guidelines)](#46-deployment-general-guidelines)
5.  [Logging and Monitoring](#5-logging-and-monitoring)
    *   [5.1. Application Logging (`config/logging_config.py`)](#51-application-logging-configlogging_configpy)
    *   [5.2. Query Logging (`question_log.jsonl`)](#52-query-logging-question_logjsonl)
    *   [5.3. Monitoring](#53-monitoring)
6.  [Advanced Topics & Future Enhancements](#6-advanced-topics--future-enhancements)
    *   [6.1. Scalability Considerations](#61-scalability-considerations)
    *   [6.2. Security Enhancements](#62-security-enhancements)
    *   [6.3. Cost Optimization Strategies](#63-cost-optimization-strategies)
    *   [6.4. Potential Future Enhancements](#64-potential-future-enhancements)
7.  [Appendix](#7-appendix)
    *   [7.1. Glossary of Terms](#71-glossary-of-terms)
    *   [7.2. Key Python Libraries Used](#72-key-python-libraries-used)
    *   [7.3. Troubleshooting Common Issues](#73-troubleshooting-common-issues)
    *   [7.4. Developer Contacts / Contribution Guidelines](#74-developer-contacts--contribution-guidelines)

---

## 1. Introduction

### 1.1. Project Overview

*   **Purpose:** AQu (AI Question Answering) is a sophisticated backend system designed to provide intelligent question-answering capabilities. It serves as a centralized AI engine for various frontend applications, initially tailored for "Reliance" and "Merchandising" use cases.
*   **Core Functionality:** AQu processes natural language queries against a corpus of PDF documents, leveraging advanced AI models to generate accurate and contextually relevant answers.
*   **Key Benefits:**
    *   **Unified AI Backend:** A single, robust system for multiple frontends.
    *   **High Accuracy:** Utilizes Retrieval-Augmented Generation (RAG) to ground answers in source documents, minimizing hallucinations.
    *   **Performance:** Employs a multi-layer Redis caching system for rapid responses to repeated or similar queries.
    *   **Cost Optimization:** Smart caching and a tiered AI model approach significantly reduce operational costs.
    *   **Scalability:** Designed to handle a growing number of documents and user queries.

### 1.2. Architecture Overview

*   **Conceptual Layers:**
    *   **API Layer (FastAPI):** The entry point for all frontend requests. Manages request/response handling, validation, and routing.
    *   **Core Services:**
        *   **AI Service (`AIService`):** Orchestrates the RAG pipeline, interacts with Azure OpenAI models.
        *   **PDF Manager (`PDFManager`):** Handles loading, parsing, and chunking of PDF documents.
        *   **Cache Manager (`SmartCacheManager`):** Manages the Redis-based caching logic.
    *   **Data Layer:**
        *   **Redis:** In-memory data store for caching query responses and metadata.
        *   **File System:** Stores PDF documents organized by category.
*   **Technology Stack:**
    *   **Programming Language:** Python 3.x
    *   **Web Framework:** FastAPI
    *   **AI Models:** Azure OpenAI Service (GPT-4.1 family: Main, Mini, Nano)
    *   **NLP Library:** NLTK (Natural Language Toolkit)
    *   **Caching:** Redis
*   **High-Level Diagram:**
    ```mermaid
    graph TD
        A[Frontend Applications <br/> (Reliance, Merchandising)] --> B{API Layer <br/> (FastAPI)};
        B <--> C[PDF Manager <br/> (Loads/Parses PDFs)];
        B --> D{AI Service <br/> (RAG Pipeline, LLMs)};
        D <--> E[Cache Manager <br/> (Redis Interaction)];
        E --> F[Redis <br/> (Cached Responses)];
    ```

---

## 2. Core Backend Technologies

### 2.1. Redis Caching System (`SmartCacheManager`)

*   **2.1.1. Purpose and Benefits:**
    *   **Why Redis?** Chosen for its exceptional speed as an in-memory datastore, versatile data structures, and proven scalability, making it ideal for a high-performance caching layer.
    *   **Impact:**
        *   **Reduced Latency:** Significantly speeds up response times for frequently asked or semantically similar questions by serving pre-computed answers directly from cache.
        *   **Cost Reduction:** Drastically cuts down on expensive API calls to Azure OpenAI models, as cached results bypass the need for re-processing by the AI.
        *   **Improved User Experience:** Faster responses lead to a more fluid and responsive application.
*   **2.1.2. The `SmartCacheManager`:**
    *   This class (likely found in `core/cache_manager.py`) encapsulates all caching logic.
    *   **Key Responsibilities:** Storing new Q&A pairs, retrieving cached responses, managing cache expiration (TTL), manual cache clearing, and providing cache performance statistics.
*   **2.1.3. Multi-Layer Cache Matching System:**
    *   AQu employs a sophisticated, tiered approach to maximize cache hit rates:
    *   **Layer 1: Exact Normalized Match:** The incoming query is normalized (lowercase, remove punctuation) and used for a direct lookup. Fastest match.
    *   **Layer 2: Fuzzy Text Similarity Matching:** If no exact match, a similarity score is calculated between the incoming query and cached queries using a weighted combination of algorithms (e.g., SequenceMatcher, Jaccard Similarity on keywords, Token Set Similarity). If the score exceeds `CACHE_SIMILARITY_THRESHOLD`, it's a potential fuzzy match.
    *   **Layer 3: Optional GPT-4.1 Nano Verification:** If `CACHE_NANO_VERIFICATION` is enabled, the cached answer and new query are sent to GPT-4.1 Nano to verify relevance, adding an extra layer of confidence for fuzzy matches.
    *   **Visual Flow:**
        ```mermaid
        graph LR
            A[Query] --> B{Normalize Query};
            B --> C{Exact Match in Redis?};
            C -- Yes --> D[Return Cached Response];
            C -- No --> E{Iterate Cached Queries};
            E --> F{Calculate Fuzzy Similarity Score};
            F --> G{Score > Threshold?};
            G -- Yes --> H{Optional Nano Verification};
            H -- Verified Yes --> D;
            G -- No/Verification Failed --> I[Cache Miss - Process via RAG];
            H -- No --> I;
        ```
*   **2.1.4. Cache Key Generation:**
    *   The `_generate_cache_key(query: str, category: str) -> str` method creates unique keys, typically combining a prefix (e.g., "query:"), a normalized query, and the category (e.g., `query:reliance:what is the return policy`).
*   **2.1.5. Cache Invalidation and TTL (Time-To-Live):**
    *   **TTL:** Each item has a TTL (e.g., `CACHE_TTL=3600` seconds). Redis automatically evicts expired items.
    *   **Manual Invalidation:** `/api/clear-cache` endpoint flushes the cache. The `force_no_cache: true` parameter in `/api/query` bypasses the cache for a specific query.
*   **2.1.6. Structure of Cached Data:**
    *   Stored as JSON strings in Redis, including the answer, original query, normalized query, keywords, category, cache timestamp, etc.
*   **2.1.7. Configuration (Environment Variables):**
    *   `REDIS_HOST`, `REDIS_PORT`, `REDIS_DB`, `REDIS_PASSWORD`
    *   `CACHE_TTL`, `CACHE_SIMILARITY_THRESHOLD`, `CACHE_NANO_VERIFICATION`

### 2.2. Retrieval-Augmented Generation (RAG) System

*   **2.2.1. Concept and Purpose:**
    *   **What is RAG?** Enhances LLMs by dynamically providing external knowledge, grounding responses in information retrieved from PDF documents.
    *   **Why RAG in AQu?** Ensures contextual accuracy, reduces hallucinations, provides up-to-date information, and allows source attribution.
*   **2.2.2. `EnhancedRAGSystem` / `EnhancedRAGSystemNLTK`:**
    *   Located in `enhanced_rag_system.py` and `enhanced_rag_nltk.py`, these classes orchestrate the RAG pipeline, managing a multi-model approach (Nano, Mini, Main GPT-4.1 models). The NLTK version uses NLTK for initial text processing.
*   **2.2.3. RAG Pipeline Stages:**
    *   **Stage 0: Document Ingestion and Preprocessing (`PDFManager`):** Loads, parses, cleans, and chunks PDFs into manageable paragraphs with unique IDs.
    *   **Stage 1: Query & Document Text Cleanup (Nano Model or NLTK):** Standardizes the user query and document chunks for better processing.
    *   **Stage 2: Relevance Scoring and Chunk Selection (Retrieval Phase - GPT-4.1 Mini):** GPT-4.1 Mini evaluates the relevance of each chunk to the query, assigning scores. The top N most relevant paragraphs are selected.
    *   **Stage 3: Contextual Answer Generation (Generation Phase - GPT-4.1 Main):** The original query and top N relevant paragraphs are fed to GPT-4.1 Main, which generates the final answer based *only* on the provided context, along with citations.
    *   **RAG Pipeline Flowchart:**
        ```mermaid
        graph TD
            U[User Query] --> P1[Stage 1: Query/Text Cleanup <br/> (Nano/NLTK)];
            P1 --> SQ[Cleaned Query];
            Doc[PDF Document(s)] --> P0[Stage 0: PDF Parsing & Chunking <br/> (PDFManager)];
            P0 --> DC[Document Chunks];
            DC --> P1D[Stage 1: Doc Chunk Cleanup <br/> (Nano/NLTK)];
            P1D --> SDC[Cleaned Chunks];
            SQ & SDC --> P2[Stage 2: Relevance Scoring <br/> (GPT-4.1 Mini)];
            P2 --> TRC[Top N Relevant Chunks];
            SQ & TRC --> P3[Stage 3: Answer Generation <br/> (GPT-4.1 Main)];
            P3 --> FA[Final Answer, Citations, Reasoning];
        ```
*   **2.2.4. AI Model Roles in RAG:**
    *   **GPT-4.1 Nano:** Efficient for text cleanup (if not NLTK) and optional cache verification.
    *   **GPT-4.1 Mini:** Balances cost and capability for relevance scoring/retrieval.
    *   **GPT-4.1 Main (Flagship):** Most powerful model for final answer generation, requiring deep understanding and synthesis.

### 2.3. NLTK (Natural Language Toolkit) Implementation

*   **2.3.1. Purpose in AQu:**
    *   Provides a local, cost-effective library for text preprocessing tasks, serving as an alternative or complement to the Nano AI model for initial cleaning and structuring.
    *   **Key Tasks:** Tokenization (words, sentences), lemmatization, stop word removal, regex-based cleaning, and paragraph segmentation.
*   **2.3.2. `NLTKTextProcessor` Class:**
    *   Likely found in `enhanced_rag_nltk.py`, this class centralizes NLTK functionalities.
    *   **Initialization:** Downloads NLTK resources (punkt, stopwords, wordnet) and initializes components like `WordNetLemmatizer`.
    *   **Core Methods:** `clean_text()` and `identify_paragraphs()`.
*   **2.3.3. Integration with RAG (`EnhancedRAGSystemNLTK`):**
    *   The `NLTKTextProcessor` is used at the beginning of the RAG pipeline to preprocess queries and document text, and to segment documents into paragraphs.

---

## 3. API Endpoints
*(Refer to `api/routes.py` & `app.py`)*

The AQu backend exposes RESTful API endpoints using FastAPI.

### 3.1. Main Query Processing
*   **Endpoint:** `POST /api/query`
*   **Purpose:** Submits a question for an AI-generated answer based on PDF content.
*   **Request Body (JSON):**
    ```json
    {
      "query": "string (required)",
      "category": "string (required) - e.g., 'reliance', 'merchandising'",
      "pdf_name": "string (optional) - Specific PDF filename",
      "force_no_cache": "boolean (optional, default: false)"
    }
    ```
*   **Successful Response (200 OK):** Includes the answer, source citations, cache status, cost details, and processing time. (See previous detailed draft for full response structure).

### 3.2. Document Management
*   **Endpoint:** `GET /api/pdfs`
    *   **Purpose:** Lists available PDF documents by category.
*   **Endpoint:** `POST /api/refresh-pdfs`
    *   **Purpose:** Refreshes the `PDFManager`'s internal cache of documents from the file system.

### 3.3. System Status and Administration
*   **Endpoint:** `GET /` (Root)
    *   **Purpose:** Serves an HTML status dashboard.
*   **Endpoint:** `GET /health`
    *   **Purpose:** Simple health check.
*   **Endpoint:** `GET /api/ai-status`
    *   **Purpose:** Detailed status of AI services, model health, and cache statistics.
*   **Endpoint:** `POST /api/clear-cache`
    *   **Purpose:** Clears all items from the Redis cache.
*   **Endpoint:** `GET /api/download-question-logs`
    *   **Purpose:** Downloads a CSV of logged questions and analytics from `question_log.jsonl`.

### 3.4. PDF Serving (Static Files)
*   **Endpoint:** `GET /pdf/{category}/{filename}`
*   **Purpose:** Serves PDF files directly from `static/pdfs/`.

---

## 4. System Setup, Configuration, and Deployment

### 4.1. Prerequisites
*   Python 3.8+
*   Pip
*   Redis server
*   Azure OpenAI Service access with GPT-4.1 family models deployed.

### 4.2. Initial Setup Steps
1.  Clone repository.
2.  Navigate to `AQu` directory.
3.  Create and activate a Python virtual environment.
4.  Install dependencies: `pip install -r requirements.txt`.
5.  Ensure NLTK data can be downloaded on first run.

### 4.3. Configuration (`.env` file & `config/settings.py`)
1.  Copy `sample.env` to `.env`.
2.  Edit `.env` with specific values for:
    *   Azure OpenAI credentials for Main, Mini, and Nano models (API Keys, Endpoints, Deployment Names, API Version).
    *   Redis Configuration (`REDIS_HOST`, `PORT`, `DB`, `PASSWORD`).
    *   Cache Behavior (`CACHE_TTL`, `CACHE_SIMILARITY_THRESHOLD`, `CACHE_NANO_VERIFICATION`).
    *   Application Settings (`PDF_DIR`, `LOG_LEVEL`, `LOG_DIR`, `QUESTION_LOG_FILE`, `MAX_CONTEXT_TOKENS_MAIN`).
    *   Refer to `config/settings.py` for Pydantic models managing these settings and `config/credentials.py` for helper functions. `config/config.json` may store model pricing.

### 4.4. PDF Document Structure
*   Store PDFs in subdirectories under `PDF_DIR` (default: `static/pdfs/`), organized by category (e.g., `static/pdfs/reliance/`, `static/pdfs/merchandising/`).

### 4.5. Running the Application Locally
*   Use Uvicorn: `uvicorn app:app --host 0.0.0.0 --port 8000 --reload`
*   Access at `http://localhost:8000`. Swagger UI at `/docs`.

### 4.6. Deployment (General Guidelines)
*   **Production Server:** Uvicorn with Gunicorn (e.g., `gunicorn -w 4 -k uvicorn.workers.UvicornWorker app:app -b 0.0.0.0:8000`).
*   **Containerization (Docker):** Use a `Dockerfile` to build and run the application. Pass environment variables securely.
*   **Cloud Platforms:** Azure App Service, AKS, AWS Elastic Beanstalk, Google Cloud Run, etc.
*   **Reverse Proxy (Nginx, Traefik):** For SSL, load balancing, etc.
*   **PDF Volume:** For large volumes, consider cloud object storage (Azure Blob, S3) and adapt `PDFManager`.
*   **Security:** Secure credentials, HTTPS, API rate limiting/auth.

---

## 5. Logging and Monitoring

### 5.1. Application Logging (`config/logging_config.py`)
*   Structured logging using Python's `logging` module.
*   Configurable via `LOG_LEVEL` in `.env`.
*   Outputs to console and rotated files in `LOG_DIR` (default: `logs/`).

### 5.2. Query Logging (`question_log.jsonl`)
*   Records details about each query to `/api/query` in JSONL format.
*   Includes timestamp, query ID, user query, category, cache status, processing time, model used, cost, etc.
*   Used by `/api/download-question-logs` and for external analytics.

### 5.3. Monitoring
*   **Status Page (`/`):** HTML dashboard for real-time system overview.
*   **Health Check (`/health`):** For external monitoring tools.
*   **External Tools:** Uptime monitoring (UptimeRobot), APM (Azure Application Insights, Datadog), Log Management (Azure Monitor, Grafana Loki).
*   **Key Metrics:** API latency/error rates, cache hit rate, Azure OpenAI API performance, server resource utilization, Redis performance.

---

## 6. Advanced Topics & Future Enhancements

### 6.1. Scalability Considerations
*   Horizontal scaling of the stateless AQu app instances.
*   Clustered/managed Redis for high loads.
*   Cloud object storage for very large PDF volumes.
*   Asynchronous task queues (Celery) for long-running RAG processes.

### 6.2. Security Enhancements
*   API authentication/authorization (API keys, OAuth2).
*   Robust input validation and sanitization.
*   Regular dependency updates and vulnerability scanning.

### 6.3. Cost Optimization Strategies
*   Continuous model selection tuning.
*   Prompt engineering for conciseness.
*   Azure Reserved Instances/Savings Plans for AI model usage.

### 6.4. Potential Future Enhancements
*   User feedback loop for answer quality.
*   Hybrid search (vector search + keyword) for RAG retrieval.
*   Conversational memory for multi-turn interactions.
*   Advanced analytics dashboard.
*   Automated PDF ingestion pipeline.
*   Fine-tuning smaller AI models on domain-specific Q&A.

---

## 7. Appendix

### 7.1. Glossary of Terms
*   **AQu:** AI Question Answering (this system).
*   **API:** Application Programming Interface.
*   **ASGI:** Asynchronous Server Gateway Interface.
*   **Azure OpenAI:** Microsoft's cloud service for OpenAI models.
*   **Cache Hit/Miss:** Data found/not found in cache.
*   **FastAPI:** Python web framework.
*   **GPT:** Generative Pre-trained Transformer (LLM type).
*   **JSONL:** JSON Lines format.
*   **Lemmatization:** Reducing words to their base form.
*   **LLM:** Large Language Model.
*   **NLTK:** Natural Language Toolkit.
*   **PDF:** Portable Document Format.
*   **Pydantic:** Python library for data validation.
*   **RAG:** Retrieval-Augmented Generation.
*   **Redis:** In-memory data store.
*   **Stop Words:** Common words removed during preprocessing.
*   **Tiktoken:** OpenAI's tokenizer library.
*   **Token:** Unit of text processed by LLMs.
*   **TTL:** Time-To-Live for cached data.
*   **Uvicorn:** ASGI server.

### 7.2. Key Python Libraries Used
*   `fastapi`, `uvicorn`, `httpx`, `pydantic`, `pydantic-settings`, `redis`, `nltk`, `pypdf`, `tiktoken`.

### 7.3. Troubleshooting Common Issues
*   **Azure OpenAI API Errors:** Check keys, endpoints, deployment names, network, Azure quotas.
*   **Redis Connection Errors:** Verify Redis server status and connection parameters.
*   **NLTK Data Errors (`LookupError`):** Ensure internet for initial NLTK resource download.
*   **PDF Processing Errors:** Check PDF integrity, `PDF_DIR` path, permissions.
*   **`ModuleNotFoundError`:** Check virtual environment activation and `requirements.txt` installation.
*   **Port Already in Use:** Stop conflicting process or use a different port.

### 7.4. Developer Contacts / Contribution Guidelines
*   *(Placeholder for team contacts or contribution guidelines)* 