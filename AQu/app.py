from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import HTMLResponse, FileResponse, Response
from fastapi.staticfiles import StaticFiles
from config.logging_config import setup_logging, get_logger
from config.settings import Settings
from config.credentials import get_azure_config
from core.instances import pdf_manager  # Import shared instance
from core.ai_credentials_check import ai_credentials_checker
from api.routes import router as api_router
import uvicorn
import psutil
import platform
import datetime
import os
from pathlib import Path
import requests
from pypdf import PdfReader
from nltk.tokenize import sent_tokenize
import tiktoken
from io import BytesIO
from uuid import uuid4
from openai import AzureOpenAI
from pydantic import BaseModel
import nltk
from typing import Optional
import asyncio
import aiohttp
import time
from core.cache_manager import RedisCacheManager
from email.utils import formatdate

# Initialize logging
setup_logging()
logger = get_logger(__name__)

# NLTK Punkt download
try:
    nltk.data.find('tokenizers/punkt')
except nltk.downloader.DownloadError:
    logger.info("NLTK 'punkt' tokenizer not found. Downloading...")
    nltk.download('punkt')
    logger.info("'punkt' tokenizer downloaded.")
except Exception as e: # Catch other potential exceptions during NLTK setup
    logger.error(f"An error occurred during NLTK setup: {e}")

# Initialize settings
settings = Settings()
if not settings.validate():
    raise RuntimeError("Invalid configuration")

# Create FastAPI app
app = FastAPI(
    title="AQu API",
    description="AI-powered Question Answering API",
    version="1.0.0"
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://localhost:8080",
        "http://localhost:5173",
        "http://127.0.0.1:3000",
        "http://127.0.0.1:8080",
        "http://127.0.0.1:5173",
        "http://57.154.209.147",
        "http://57.154.209.147:8080",
        "http://57.154.209.147:3000",
        "http://57.154.209.147:5173"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API routes
app.include_router(api_router)

# Mount static files
app.mount("/static", StaticFiles(directory="static"), name="static")

# Add PDF serving route
@app.get("/pdf/{category}/{filename}")
@app.head("/pdf/{category}/{filename}")
async def serve_pdf(category: str, filename: str, request: Request):
    """Serve PDF files from the static directory with explicit CORS headers."""
    pdf_path = Path("static/pdfs") / category / filename
    if not pdf_path.exists():
        raise HTTPException(status_code=404, detail="PDF not found")
    
    # For HEAD requests, return headers only
    if request.method == "HEAD":
        return Response(
            status_code=200,
            headers={
                "Content-Type": "application/pdf",
                "Content-Length": str(pdf_path.stat().st_size),
                "Access-Control-Allow-Origin": "*",
                "Access-Control-Allow-Methods": "GET, HEAD, OPTIONS",
                "Access-Control-Allow-Headers": "*",
                "Cache-Control": "public, max-age=3600",
                "Last-Modified": formatdate(pdf_path.stat().st_mtime),
                "ETag": f'"{pdf_path.stat().st_mtime}"'
            }
        )
    
    # For GET requests, return the file
    return FileResponse(
        pdf_path,
        media_type="application/pdf",
        headers={
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "GET, HEAD, OPTIONS",
            "Access-Control-Allow-Headers": "*",
            "Cache-Control": "public, max-age=3600"
        }
    )

# Add OPTIONS handler for PDF route to handle preflight requests
@app.options("/pdf/{category}/{filename}")
async def options_pdf(category: str, filename: str):
    """Handle CORS preflight requests for PDF files."""
    return Response(
        status_code=200,
        headers={
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "GET, HEAD, OPTIONS",
            "Access-Control-Allow-Headers": "*",
            "Access-Control-Max-Age": "3600"
        }
    )

@app.get("/health")
async def health_check():
    """Health check endpoint."""
    return {
        "status": "healthy", 
        "timestamp": datetime.datetime.now().isoformat(),
        "service": "AQu API",
        "version": "1.0.0"
    }

def get_system_info():
    """Get comprehensive system information for status page."""
    try:
        # Basic system info
        cpu_count = psutil.cpu_count()
        cpu_freq = psutil.cpu_freq()
        memory = psutil.virtual_memory()
        disk = psutil.disk_usage('/')
        boot_time = psutil.boot_time()
        
        # Network info
        net_io = psutil.net_io_counters()
        
        # Process specific info
        process = psutil.Process(os.getpid())
        process_memory = process.memory_info()
        process_cpu = process.cpu_percent()
        
        # Load average (Unix systems)
        try:
            load_avg = os.getloadavg()
        except (OSError, AttributeError):
            load_avg = [0, 0, 0]
        
        return {
            "timestamp": datetime.datetime.now().isoformat(),
            "platform": {
                "system": platform.system(),
                "platform": platform.platform(),
                "machine": platform.machine(),
                "processor": platform.processor(),
                "python_version": platform.python_version(),
                "architecture": platform.architecture()[0]
            },
            "cpu": {
                "usage_percent": psutil.cpu_percent(interval=1),
                "count": cpu_count,
                "frequency": {
                    "current": cpu_freq.current if cpu_freq else 0,
                    "min": cpu_freq.min if cpu_freq else 0,
                    "max": cpu_freq.max if cpu_freq else 0
                },
                "load_average": load_avg,
                "per_cpu": psutil.cpu_percent(percpu=True) if cpu_count <= 16 else []
            },
            "memory": {
                "total": memory.total,
                "available": memory.available,
                "used": memory.used,
                "percentage": memory.percent,
                "total_gb": round(memory.total / (1024**3), 2),
                "used_gb": round(memory.used / (1024**3), 2),
                "available_gb": round(memory.available / (1024**3), 2)
            },
            "disk": {
                "total": disk.total,
                "used": disk.used,
                "free": disk.free,
                "percentage": (disk.used / disk.total) * 100,
                "total_gb": round(disk.total / (1024**3), 2),
                "used_gb": round(disk.used / (1024**3), 2),
                "free_gb": round(disk.free / (1024**3), 2)
            },
            "network": {
                "bytes_sent": net_io.bytes_sent,
                "bytes_recv": net_io.bytes_recv,
                "packets_sent": net_io.packets_sent,
                "packets_recv": net_io.packets_recv,
                "bytes_sent_mb": round(net_io.bytes_sent / (1024**2), 2),
                "bytes_recv_mb": round(net_io.bytes_recv / (1024**2), 2)
            },
            "uptime": {
                "boot_time": boot_time,
                "uptime_seconds": datetime.datetime.now().timestamp() - boot_time,
                "uptime_formatted": str(datetime.timedelta(seconds=int(datetime.datetime.now().timestamp() - boot_time)))
            },
            "process": {
                "pid": os.getpid(),
                "memory_rss": process_memory.rss,
                "memory_vms": process_memory.vms,
                "memory_rss_mb": round(process_memory.rss / (1024**2), 2),
                "memory_vms_mb": round(process_memory.vms / (1024**2), 2),
                "cpu_percent": process_cpu,
                "create_time": process.create_time(),
                "num_threads": process.num_threads(),
                "status": process.status()
            }
        }
    except Exception as e:
        logger.error(f"Error getting system info: {str(e)}")
        return {"error": str(e), "timestamp": datetime.datetime.now().isoformat()}

async def test_api_endpoints():
    """Test API endpoints and return their status."""
    base_url = "http://localhost:8000"  # Adjust if needed
    endpoints = [
        {"name": "AI Status", "path": "/api/ai-status", "method": "GET"},
        {"name": "PDFs", "path": "/api/pdfs", "method": "GET"},
        {"name": "Pricing", "path": "/api/pricing", "method": "GET"},
        {"name": "Health Check", "path": "/health", "method": "GET"},
        {"name": "Documentation", "path": "/docs", "method": "GET"},
        {"name": "OpenAPI Schema", "path": "/openapi.json", "method": "GET"}
    ]
    
    endpoint_status = {}
    
    async with aiohttp.ClientSession(timeout=aiohttp.ClientTimeout(total=2)) as session:
        for endpoint in endpoints:
            try:
                start_time = time.time()
                async with session.request(endpoint["method"], f"{base_url}{endpoint['path']}") as response:
                    response_time = int((time.time() - start_time) * 1000)
                    if response.status < 400:
                        endpoint_status[endpoint["name"]] = {
                            "status": "✅ Online",
                            "response_time": response_time,
                            "status_code": response.status
                        }
                    else:
                        endpoint_status[endpoint["name"]] = {
                            "status": "⚠️ Warning",
                            "response_time": response_time,
                            "status_code": response.status
                        }
            except Exception as e:
                endpoint_status[endpoint["name"]] = {
                    "status": "❌ Offline",
                    "response_time": 0,
                    "error": str(e)[:30] + "..." if len(str(e)) > 30 else str(e)
                }
    
    return endpoint_status

@app.get("/", response_class=HTMLResponse)
async def status_page():
    """Render the enhanced modern status page."""
    system_info = get_system_info()
    pdfs = list(pdf_manager.pdf_cache.keys())
    cache_manager = RedisCacheManager()
    cache_stats = cache_manager.get_cache_stats()
    redis_status = {
        "connected": cache_manager.redis_client is not None,
        "host": settings.get("REDIS_HOST", "localhost"),
        "port": settings.get("REDIS_PORT", 6379),
        "db": settings.get("REDIS_DB", 0),
        "cache_ttl": settings.get("CACHE_TTL", 3600),
        "similarity_threshold": settings.get("CACHE_SIMILARITY_THRESHOLD", 0.85)
    }
    
    # Get AI credentials status
    try:
        ai_status = ai_credentials_checker.check_all_credentials()
    except Exception as e:
        logger.error(f"Error checking AI status: {str(e)}")
        ai_status = {
            "overall_status": "❌ Error checking status",
            "models": {},
            "timestamp": 0
        }
    
    # Test API endpoints
    try:
        endpoint_status = await test_api_endpoints()
    except Exception as e:
        logger.error(f"Error testing endpoints: {str(e)}")
        endpoint_status = {}
    
    html_content = f"""
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>AQu API Status Dashboard</title>
        <link href="https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/tailwind.min.css" rel="stylesheet">
        <link href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" rel="stylesheet">
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap" rel="stylesheet">
        <style>
            * {{
                font-family: 'Inter', sans-serif;
            }}
            
            body {{
                background: #f8fafc;
                min-height: 100vh;
                overflow-x: hidden;
            }}
            
            .dashboard-card {{
                background: white;
                border: 1px solid #e5e7eb;
                box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
                transition: all 0.2s ease;
            }}
            
            .dashboard-card:hover {{
                box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
                transform: translateY(-1px);
                border-color: #d1d5db;
            }}
            
            .section-title {{
                font-size: 0.875rem;
                font-weight: 600;
                color: #111827;
                display: flex;
                align-items: center;
                gap: 0.5rem;
                margin-bottom: 0.75rem;
            }}
            
            .section-title i {{
                font-size: 1rem;
                transition: transform 0.2s ease;
            }}
            
            .dashboard-card:hover .section-title i {{
                transform: scale(1.1);
            }}
            
            .metric-value {{
                font-size: 2rem;
                font-weight: 700;
                color: #111827;
                line-height: 1;
            }}
            
            .metric-label {{
                font-size: 0.75rem;
                font-weight: 500;
                color: #6b7280;
                text-transform: uppercase;
                letter-spacing: 0.05em;
                margin-top: 0.25rem;
            }}
            
            .status-badge {{
                display: inline-flex;
                align-items: center;
                gap: 0.25rem;
                padding: 0.25rem 0.75rem;
                border-radius: 9999px;
                font-size: 0.75rem;
                font-weight: 500;
                transition: all 0.15s ease;
            }}
            
            .status-online {{
                background: #d1fae5;
                color: #065f46;
                border: 1px solid #6ee7b7;
            }}
            
            .status-warning {{
                background: #fed7aa;
                color: #92400e;
                border: 1px solid #fbbf24;
            }}
            
            .status-error {{
                background: #fee2e2;
                color: #991b1b;
                border: 1px solid #fca5a5;
            }}
            
            .progress-bar {{
                background: #e5e7eb;
                border-radius: 0.25rem;
                height: 0.5rem;
                overflow: hidden;
                margin: 0.75rem 0;
            }}
            
            .progress-fill {{
                height: 100%;
                border-radius: 0.25rem;
                transition: width 0.3s ease;
            }}
            
            .progress-cpu {{ background: #6366f1; }}
            .progress-memory {{ background: #06b6d4; }}
            .progress-disk {{ background: #10b981; }}
            .progress-network {{ background: #f59e0b; }}
            
            .info-row {{
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: 0.5rem 0;
                border-bottom: 1px solid #f3f4f6;
                font-size: 0.875rem;
            }}
            
            .info-row:last-child {{
                border-bottom: none;
            }}
            
            .info-label {{
                color: #6b7280;
                display: flex;
                align-items: center;
                gap: 0.5rem;
            }}
            
            .info-value {{
                color: #111827;
                font-weight: 500;
            }}
            
            .model-card {{
                background: #f9fafb;
                border: 1px solid #e5e7eb;
                border-radius: 0.5rem;
                padding: 1rem;
                height: 100%;
            }}
            
            .model-card:hover {{
                background: #f3f4f6;
            }}
            
            .document-item {{
                display: flex;
                align-items: center;
                gap: 0.5rem;
                padding: 0.5rem;
                background: #f9fafb;
                border-radius: 0.375rem;
                font-size: 0.875rem;
                margin-bottom: 0.5rem;
                transition: all 0.15s ease;
                border: 1px solid transparent;
            }}
            
            .document-item:hover {{
                background: #f3f4f6;
                border-color: #e5e7eb;
                transform: translateX(4px);
            }}
            
            .endpoint-item {{
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: 0.5rem;
                background: #f9fafb;
                border-radius: 0.375rem;
                font-size: 0.875rem;
                margin-bottom: 0.5rem;
                transition: all 0.15s ease;
                border: 1px solid transparent;
            }}
            
            .endpoint-item:hover {{
                background: #f3f4f6;
                border-color: #e5e7eb;
            }}
            
            .cache-button {{
                padding: 0.5rem 1rem;
                border-radius: 0.375rem;
                font-size: 0.875rem;
                font-weight: 500;
                text-align: center;
                transition: all 0.15s ease;
                cursor: pointer;
                border: none;
                width: 100%;
            }}
            
            .cache-button:hover {{
                transform: translateY(-1px);
            }}
            
            .cache-button-primary {{
                background: #3b82f6;
                color: white;
            }}
            
            .cache-button-primary:hover {{
                background: #2563eb;
            }}
            
            .cache-button-danger {{
                background: #ef4444;
                color: white;
            }}
            
            .cache-button-danger:hover {{
                background: #dc2626;
            }}
            
            .header-card {{
                background: linear-gradient(135deg, #7c3aed 0%, #6366f1 50%, #0891b2 100%);
                color: white;
                box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
            }}
            
            .pulse-dot {{
                width: 0.5rem;
                height: 0.5rem;
                background: #10b981;
                border-radius: 50%;
                animation: pulse 2s infinite;
            }}
            
            @keyframes pulse {{
                0% {{
                    box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.7);
                }}
                70% {{
                    box-shadow: 0 0 0 10px rgba(16, 185, 129, 0);
                }}
                100% {{
                    box-shadow: 0 0 0 0 rgba(16, 185, 129, 0);
                }}
            }}
            
            .equal-height {{
                min-height: 320px;
            }}
            
            .scrollbar-thin {{
                scrollbar-width: thin;
                scrollbar-color: #d1d5db transparent;
            }}
            
            .scrollbar-thin::-webkit-scrollbar {{
                width: 4px;
            }}
            
            .scrollbar-thin::-webkit-scrollbar-track {{
                background: transparent;
            }}
            
            .scrollbar-thin::-webkit-scrollbar-thumb {{
                background: #d1d5db;
                border-radius: 2px;
            }}
        </style>
    </head>
    <body>
        <div class="min-h-screen p-4 sm:p-6 lg:p-8">
            <div class="max-w-7xl mx-auto">
                <!-- Header -->
                <div class="header-card rounded-lg p-6 mb-6">
                    <div class="flex items-center justify-between">
                        <div>
                            <h1 class="text-3xl font-bold flex items-center gap-3">
                                <i class="fas fa-robot"></i>
                                AQu API Dashboard
                            </h1>
                            <p class="text-blue-100 mt-2">AI-powered Question Answering System</p>
                        </div>
                        <div class="flex items-center gap-4">
                            <div class="flex items-center gap-2">
                                <div class="pulse-dot"></div>
                                <span class="text-sm">System Online</span>
                            </div>
                            <button onclick="location.reload()" class="bg-white bg-opacity-20 hover:bg-opacity-30 px-4 py-2 rounded-lg text-sm font-medium transition-all">
                                <i class="fas fa-sync-alt mr-2"></i>
                                Refresh
                            </button>
                        </div>
                    </div>
                </div>

                <!-- Main Grid -->
                <div class="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-6">
                    <!-- AI Models Status - spans 2 columns -->
                    <div class="lg:col-span-2">
                        <div class="dashboard-card rounded-lg p-6 h-full">
                            <div class="section-title">
                                <i class="fas fa-brain text-violet-600"></i>
                                AI Models Status
                                <span class="ml-auto status-badge {'status-online' if '✅' in ai_status['overall_status'] else 'status-warning' if '⚠️' in ai_status['overall_status'] else 'status-error'}">
                                    {ai_status['overall_status'].replace('AI Models Status: ', '')}
                                </span>
                            </div>
                            <div class="grid grid-cols-3 gap-3">
                                {_generate_ai_model_cards(ai_status.get('models', {}))}
                            </div>
                        </div>
                    </div>
                    
                    <!-- System Overview -->
                    <div class="lg:col-span-2">
                        <div class="dashboard-card rounded-lg p-6 h-full">
                            <div class="section-title">
                                <i class="fas fa-server text-sky-600"></i>
                                System Overview
                            </div>
                            <div class="grid grid-cols-2 gap-4">
                                <div class="info-row">
                                    <span class="info-label">
                                        <i class="fas fa-desktop text-gray-400"></i>
                                        Platform
                                    </span>
                                    <span class="info-value">{system_info.get('platform', {}).get('system', 'Unknown')}</span>
                                </div>
                                <div class="info-row">
                                    <span class="info-label">
                                        <i class="fas fa-clock text-gray-400"></i>
                                        Uptime
                                    </span>
                                    <span class="info-value">{system_info.get('uptime', {}).get('uptime_formatted', 'Unknown')}</span>
                                </div>
                                <div class="info-row">
                                    <span class="info-label">
                                        <i class="fas fa-hashtag text-gray-400"></i>
                                        PID
                                    </span>
                                    <span class="info-value">{system_info.get('process', {}).get('pid', 'N/A')}</span>
                                </div>
                                <div class="info-row">
                                    <span class="info-label">
                                        <i class="fas fa-file-alt text-gray-400"></i>
                                        Documents
                                    </span>
                                    <span class="info-value">{len(pdfs)} loaded</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Performance Metrics -->
                <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
                    <!-- CPU -->
                    <div class="dashboard-card rounded-lg p-6">
                        <div class="section-title">
                            <i class="fas fa-microchip text-indigo-600"></i>
                            CPU
                            <span class="ml-auto text-xs text-gray-500">{system_info.get('cpu', {}).get('count', 0)} cores</span>
                        </div>
                        <div class="text-center mb-3">
                            <div class="metric-value">{system_info.get('cpu', {}).get('usage_percent', 0):.1f}%</div>
                            <div class="metric-label">Usage</div>
                        </div>
                        <div class="progress-bar">
                            <div class="progress-fill progress-cpu" style="width: {system_info.get('cpu', {}).get('usage_percent', 0)}%"></div>
                        </div>
                        <div class="flex justify-between text-xs text-gray-500 mt-3">
                            <span>Freq: {system_info.get('cpu', {}).get('frequency', {}).get('current', 0):.0f}MHz</span>
                            <span>Load: {system_info.get('cpu', {}).get('load_average', [0])[0]:.1f}</span>
                        </div>
                    </div>

                    <!-- Memory -->
                    <div class="dashboard-card rounded-lg p-6">
                        <div class="section-title">
                            <i class="fas fa-memory text-cyan-600"></i>
                            Memory
                            <span class="ml-auto text-xs text-gray-500">{system_info.get('memory', {}).get('total_gb', 0):.0f}GB</span>
                        </div>
                        <div class="text-center mb-3">
                            <div class="metric-value">{system_info.get('memory', {}).get('percentage', 0):.1f}%</div>
                            <div class="metric-label">Used</div>
                        </div>
                        <div class="progress-bar">
                            <div class="progress-fill progress-memory" style="width: {system_info.get('memory', {}).get('percentage', 0)}%"></div>
                        </div>
                        <div class="flex justify-between text-xs text-gray-500 mt-3">
                            <span>Used: {system_info.get('memory', {}).get('used_gb', 0):.1f}GB</span>
                            <span>Free: {system_info.get('memory', {}).get('available_gb', 0):.1f}GB</span>
                        </div>
                    </div>

                    <!-- Storage -->
                    <div class="dashboard-card rounded-lg p-6">
                        <div class="section-title">
                            <i class="fas fa-hdd text-emerald-600"></i>
                            Storage
                            <span class="ml-auto text-xs text-gray-500">{system_info.get('disk', {}).get('total_gb', 0):.0f}GB</span>
                        </div>
                        <div class="text-center mb-3">
                            <div class="metric-value">{system_info.get('disk', {}).get('percentage', 0):.1f}%</div>
                            <div class="metric-label">Used</div>
                        </div>
                        <div class="progress-bar">
                            <div class="progress-fill progress-disk" style="width: {system_info.get('disk', {}).get('percentage', 0)}%"></div>
                        </div>
                        <div class="flex justify-between text-xs text-gray-500 mt-3">
                            <span>Used: {system_info.get('disk', {}).get('used_gb', 0):.0f}GB</span>
                            <span>Free: {system_info.get('disk', {}).get('free_gb', 0):.0f}GB</span>
                        </div>
                    </div>

                    <!-- Network -->
                    <div class="dashboard-card rounded-lg p-6">
                        <div class="section-title">
                            <i class="fas fa-network-wired text-amber-600"></i>
                            Network
                            <span class="ml-auto text-xs text-gray-500">I/O</span>
                        </div>
                        <div class="text-center mb-3">
                            <div class="metric-value">{int(system_info.get('network', {}).get('bytes_sent_mb', 0))}</div>
                            <div class="metric-label">MB Sent</div>
                        </div>
                        <div class="mt-4 space-y-2">
                            <div class="flex justify-between text-xs">
                                <span class="text-gray-500">Received:</span>
                                <span class="text-gray-700 font-medium">{int(system_info.get('network', {}).get('bytes_recv_mb', 0))}MB</span>
                            </div>
                            <div class="flex justify-between text-xs">
                                <span class="text-gray-500">Packets:</span>
                                <span class="text-gray-700 font-medium">{system_info.get('network', {}).get('packets_sent', 0):,}</span>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Bottom Grid -->
                <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <!-- Document Library -->
                    <div class="dashboard-card rounded-lg p-6 equal-height">
                        <div class="section-title">
                            <i class="fas fa-file-pdf text-rose-600"></i>
                            Document Library
                            <span class="ml-auto status-badge status-online">
                                {len(pdfs)} loaded
                            </span>
                        </div>
                        <div class="overflow-y-auto scrollbar-thin" style="max-height: 250px;">
                            {_generate_pdf_list(pdfs)}
                        </div>
                    </div>

                    <!-- Redis & Cache System -->
                    <div class="dashboard-card rounded-lg p-6 equal-height">
                        <div class="section-title">
                            <i class="fas fa-database text-orange-600"></i>
                            Redis & Cache System
                            <span class="ml-auto status-badge {'status-online' if redis_status.get('connected') else 'status-error'}">
                                {'Connected' if redis_status.get('connected') else 'Disconnected'}
                            </span>
                        </div>
                        <div class="space-y-3">
                            <div class="info-row">
                                <span class="info-label">Host</span>
                                <span class="info-value font-mono text-sm">{redis_status.get('host', 'N/A')}:{redis_status.get('port', 'N/A')}</span>
                            </div>
                            <div class="info-row">
                                <span class="info-label">Memory Used</span>
                                <span class="info-value">{cache_stats.get('memory', {}).get('used_memory_human', 'N/A')}</span>
                            </div>
                            <div class="info-row">
                                <span class="info-label">Cache Items</span>
                                <span class="info-value">{cache_stats.get('cache_items', {}).get('cached_queries', 0)}</span>
                            </div>
                            <div class="info-row">
                                <span class="info-label">Hit Rate</span>
                                <span class="info-value text-green-600 font-bold">{cache_stats.get('performance', {}).get('hit_rate', 0):.1f}%</span>
                            </div>
                            <div class="info-row">
                                <span class="info-label">Total Queries</span>
                                <span class="info-value">{cache_stats.get('performance', {}).get('total_queries', 0)}</span>
                            </div>
                            <div class="info-row">
                                <span class="info-label">Cache Hits</span>
                                <span class="info-value text-green-600">{cache_stats.get('performance', {}).get('cache_hits', 0)}</span>
                            </div>
                            <div class="info-row">
                                <span class="info-label">Cache Misses</span>
                                <span class="info-value text-orange-600">{cache_stats.get('performance', {}).get('cache_misses', 0)}</span>
                            </div>
                            <div class="info-row">
                                <span class="info-label">TTL</span>
                                <span class="info-value">{redis_status.get('cache_ttl', 3600)}s</span>
                            </div>
                            <div class="grid grid-cols-2 gap-3 mt-4">
                                <a href="/api/download-question-logs" class="cache-button cache-button-primary text-decoration-none">
                                    <i class="fas fa-download mr-2"></i>
                                    Download CSV
                                </a>
                                <button onclick="clearCache()" class="cache-button cache-button-danger">
                                    <i class="fas fa-trash mr-2"></i>
                                    Clear Cache
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- API Endpoints Status -->
                <div class="dashboard-card rounded-lg p-6 mt-6">
                    <div class="section-title">
                        <i class="fas fa-plug text-teal-600"></i>
                        API Endpoints Status
                    </div>
                    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                        {_generate_api_endpoints(endpoint_status)}
                    </div>
                </div>

                <!-- Footer -->
                <div class="text-center mt-8 text-sm text-gray-500">
                    <div class="flex items-center justify-center gap-6">
                        <span>
                            <i class="fas fa-clock mr-1"></i>
                            Updated: {datetime.datetime.now().strftime('%Y-%m-%d %H:%M:%S')} UTC
                        </span>
                        <span>•</span>
                        <span>PID: {system_info.get('process', {}).get('pid', 'N/A')}</span>
                        <span>•</span>
                        <span>Python {system_info.get('platform', {}).get('python_version', 'N/A')}</span>
                    </div>
                </div>
            </div>
        </div>

        <script>
            // Auto-refresh every 30 seconds
            setTimeout(() => {{
                location.reload();
            }}, 30000);
            
            // Function to clear Redis cache
            async function clearCache() {{
                if (confirm('Are you sure you want to clear the Redis cache? This will remove all cached responses.')) {{
                    try {{
                        const response = await fetch('/api/clear-cache', {{ method: 'POST' }});
                        const result = await response.json();
                        if (result.success) {{
                            alert('Cache cleared successfully!');
                            location.reload();
                        }} else {{
                            alert('Failed to clear cache: ' + result.message);
                        }}
                    }} catch (error) {{
                        alert('Error clearing cache: ' + error.message);
                    }}
                }}
            }}
        </script>
    </body>
    </html>
    """
    return HTMLResponse(content=html_content)

def _generate_ai_model_cards(models: dict) -> str:
    """Generate AI model cards with consistent styling."""
    if not models:
        return """
        <div class='col-span-3 text-center py-8'>
            <i class='fas fa-exclamation-triangle text-3xl text-amber-500 mb-3'></i>
            <p class='text-gray-600'>No AI models status available</p>
        </div>
        """
    
    cards = []
    model_names = {"mini": "GPT-4o-Mini", "main": "GPT-4o", "nano": "GPT-4o-Nano"}
    model_icons = {"mini": "fas fa-bolt", "main": "fas fa-brain", "nano": "fas fa-leaf"}
    model_colors = {"mini": "text-amber-600", "main": "text-violet-600", "nano": "text-emerald-600"}
    
    for model_type, model_info in models.items():
        status_ok = "✅" in model_info.get("status", "")
        response_time = model_info.get('response_time_ms', 0)
        
        card = f"""
        <div class="model-card">
            <div class="flex items-center justify-between mb-3">
                <h4 class="font-semibold text-gray-800 flex items-center gap-2">
                    <i class="{model_icons.get(model_type, 'fas fa-robot')} {model_colors.get(model_type, 'text-gray-600')}"></i>
                    {model_names.get(model_type, model_type.title())}
                </h4>
                <span class="{'text-emerald-600' if status_ok else 'text-rose-600'}">
                    {'✅' if status_ok else '❌'}
                </span>
            </div>
            
            <div class="space-y-2 text-sm">
                <div class="flex justify-between">
                    <span class="text-gray-500">Model:</span>
                    <span class="text-gray-700 font-medium text-xs">{model_info.get('model_name', 'Unknown')[:20]}...</span>
                </div>
                
                <div class="flex justify-between">
                    <span class="text-gray-500">Response:</span>
                    <span class="text-gray-700 font-medium">
                        {response_time}ms
                    </span>
                </div>
                
                <div class="flex justify-between">
                    <span class="text-gray-500">Functions:</span>
                    <span class="text-gray-700">{len(model_info.get("functions", []))} available</span>
                </div>
            </div>
        </div>
        """
        cards.append(card)
    
    return "".join(cards)

def _generate_pdf_list(pdfs: list) -> str:
    """Generate PDF list with consistent styling."""
    if not pdfs:
        return """
        <div class='text-center py-8'>
            <i class='fas fa-file-pdf text-3xl text-gray-400 mb-3'></i>
            <p class='text-gray-500'>No documents loaded</p>
        </div>
        """
    
    pdf_items = []
    for i, pdf in enumerate(pdfs):
        pdf_name = pdf.split('/')[-1] if '/' in pdf else pdf
        pdf_items.append(f"""
        <div class="document-item">
            <i class="fas fa-file-pdf text-rose-500"></i>
            <span class="text-gray-700 truncate" title="{pdf_name}">{pdf_name[:40]}{'...' if len(pdf_name) > 40 else ''}</span>
            <span class="ml-auto text-xs text-gray-400">#{i + 1}</span>
        </div>
        """)
    
    return "".join(pdf_items)

def _generate_api_endpoints(endpoint_status: dict) -> str:
    """Generate API endpoints with consistent styling."""
    if not endpoint_status:
        return """
        <div class='col-span-3 text-center py-8'>
            <i class='fas fa-exclamation-triangle text-3xl text-amber-500 mb-3'></i>
            <p class='text-gray-500'>Could not test API endpoints</p>
        </div>
        """
    
    endpoint_items = []
    for name, status_info in endpoint_status.items():
        status_ok = "✅" in status_info.get("status", "")
        response_time = status_info.get("response_time", 0)
        
        endpoint_items.append(f"""
        <div class="endpoint-item">
            <div class="flex items-center gap-2">
                <span class="{'text-emerald-600' if status_ok else 'text-rose-600'}">
                    {'✅' if status_ok else '❌'}
                </span>
                <span class="text-gray-700 font-medium">{name}</span>
            </div>
            <span class="text-xs text-gray-500">{response_time}ms</span>
        </div>
        """)
    
    return "".join(endpoint_items)

@app.on_event("shutdown")
async def shutdown_event():
    """Clean up resources on shutdown."""
    # Add any cleanup code here
    pass

if __name__ == "__main__":
    uvicorn.run("app:app", host="0.0.0.0", port=8000, reload=True) 