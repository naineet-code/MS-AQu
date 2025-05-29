from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import HTMLResponse, FileResponse
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
async def serve_pdf(category: str, filename: str):
    """Serve PDF files from the static directory."""
    pdf_path = Path("static/pdfs") / category / filename
    if not pdf_path.exists():
        raise HTTPException(status_code=404, detail="PDF not found")
    return FileResponse(pdf_path)

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
                background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 25%, #cbd5e1 50%, #94a3b8 75%, #64748b 100%);
                background-attachment: fixed;
                min-height: 100vh;
                overflow-x: hidden;
            }}
            
            .glass-card {{
                backdrop-filter: blur(12px);
                background: rgba(255, 255, 255, 0.85);
                border: 1px solid rgba(0, 0, 0, 0.08);
                box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
                transition: all 0.3s cubic-bezier(0.23, 1, 0.320, 1);
            }}
            
            .glass-card:hover {{
                transform: translateY(-2px);
                box-shadow: 0 8px 25px rgba(0, 0, 0, 0.12);
                background: rgba(255, 255, 255, 0.92);
                border: 1px solid rgba(0, 0, 0, 0.12);
            }}
            
            .glass-header {{
                backdrop-filter: blur(16px);
                background: rgba(255, 255, 255, 0.9);
                border: 1px solid rgba(0, 0, 0, 0.1);
                box-shadow: 0 6px 30px rgba(0, 0, 0, 0.1);
            }}
            
            .metric-card {{
                backdrop-filter: blur(8px);
                background: rgba(255, 255, 255, 0.7);
                border: 1px solid rgba(0, 0, 0, 0.06);
                transition: all 0.2s ease;
            }}
            
            .metric-card:hover {{
                background: rgba(255, 255, 255, 0.85);
                transform: scale(1.01);
            }}
            
            .status-badge {{
                backdrop-filter: blur(6px);
                border: 1px solid rgba(0, 0, 0, 0.1);
                transition: all 0.2s ease;
            }}
            
            .status-online {{
                background: linear-gradient(135deg, rgba(16, 185, 129, 0.9), rgba(5, 150, 105, 0.8));
                color: white;
                box-shadow: 0 0 15px rgba(16, 185, 129, 0.2);
            }}
            
            .status-warning {{
                background: linear-gradient(135deg, rgba(245, 158, 11, 0.9), rgba(217, 119, 6, 0.8));
                color: white;
                box-shadow: 0 0 15px rgba(245, 158, 11, 0.2);
            }}
            
            .status-error {{
                background: linear-gradient(135deg, rgba(239, 68, 68, 0.9), rgba(220, 38, 38, 0.8));
                color: white;
                box-shadow: 0 0 15px rgba(239, 68, 68, 0.2);
            }}
            
            .progress-bar {{
                background: rgba(0, 0, 0, 0.08);
                border-radius: 6px;
                overflow: hidden;
                box-shadow: inset 0 1px 3px rgba(0, 0, 0, 0.1);
            }}
            
            .progress-fill {{
                height: 6px;
                border-radius: 6px;
                transition: width 0.6s cubic-bezier(0.23, 1, 0.320, 1);
                position: relative;
            }}
            
            .progress-fill::after {{
                content: '';
                position: absolute;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.4), transparent);
                animation: shimmer 1.5s infinite;
            }}
            
            @keyframes shimmer {{
                0% {{ transform: translateX(-100%); }}
                100% {{ transform: translateX(100%); }}
            }}
            
            .cpu-progress {{ background: linear-gradient(135deg, #8b5cf6, #6366f1); }}
            .memory-progress {{ background: linear-gradient(135deg, #06b6d4, #0891b2); }}
            .disk-progress {{ background: linear-gradient(135deg, #10b981, #059669); }}
            .network-progress {{ background: linear-gradient(135deg, #f59e0b, #d97706); }}
            
            .metric-value {{
                font-size: 1.8rem;
                font-weight: 700;
                line-height: 1;
                background: linear-gradient(135deg, #1e293b, #334155);
                -webkit-background-clip: text;
                -webkit-text-fill-color: transparent;
                background-clip: text;
            }}
            
            .metric-label {{
                font-size: 0.75rem;
                font-weight: 500;
                color: #64748b;
                text-transform: uppercase;
                letter-spacing: 0.05em;
            }}
            
            .pulse-dot {{
                animation: pulse-glow 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
            }}
            
            @keyframes pulse-glow {{
                0%, 100% {{ 
                    opacity: 1; 
                    box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.7);
                }}
                50% {{ 
                    opacity: 0.8; 
                    box-shadow: 0 0 0 8px rgba(16, 185, 129, 0);
                }}
            }}
            
            .api-endpoint {{
                backdrop-filter: blur(6px);
                background: rgba(255, 255, 255, 0.6);
                border: 1px solid rgba(0, 0, 0, 0.06);
                transition: all 0.2s ease;
            }}
            
            .api-endpoint:hover {{
                background: rgba(255, 255, 255, 0.8);
                border: 1px solid rgba(0, 0, 0, 0.1);
                transform: translateX(2px);
            }}
            
            .scrollbar-thin {{
                scrollbar-width: thin;
                scrollbar-color: rgba(0, 0, 0, 0.2) transparent;
            }}
            
            .scrollbar-thin::-webkit-scrollbar {{
                width: 4px;
            }}
            
            .scrollbar-thin::-webkit-scrollbar-track {{
                background: transparent;
            }}
            
            .scrollbar-thin::-webkit-scrollbar-thumb {{
                background: rgba(0, 0, 0, 0.2);
                border-radius: 2px;
            }}
            
            .text-gradient {{
                background: linear-gradient(135deg, #1e293b, #334155);
                -webkit-background-clip: text;
                -webkit-text-fill-color: transparent;
                background-clip: text;
            }}
            
            .compact-text {{
                font-size: 0.875rem;
                line-height: 1.2;
            }}
            
            .compact-title {{
                font-size: 1.0rem;
                font-weight: 600;
                margin-bottom: 0.5rem;
            }}
            
            .equal-height {{
                min-height: 280px;
            }}
        </style>
    </head>
    <body>
        <div class="min-h-screen py-2 px-3 sm:px-4">
            <div class="max-w-7xl mx-auto">
                <!-- Compact Header -->
                <header class="text-center mb-3">
                    <div class="glass-header rounded-2xl p-3 mb-3">
                        <div class="flex items-center justify-center mb-2">
                            <div class="relative">
                                <i class="fas fa-robot text-3xl text-gradient mr-2"></i>
                                <div class="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full pulse-dot"></div>
                            </div>
                        </div>
                        <h1 class="text-2xl sm:text-3xl font-bold text-gradient mb-2">
                            AQu API Dashboard
                        </h1>
                        <p class="text-sm text-gray-600 mb-3 leading-tight">
                            AI-powered Question Answering System • Real-time Monitoring
                        </p>
                        <div class="flex items-center justify-center space-x-4">
                            <div class="status-badge status-online px-3 py-1 rounded-full font-medium text-xs">
                                <div class="w-1.5 h-1.5 bg-white rounded-full inline-block mr-1 pulse-dot"></div>
                                Online
                            </div>
                            <button onclick="location.reload()" class="status-badge px-3 py-1 rounded-full font-medium text-xs text-gray-600 hover:text-gray-800 transition-colors bg-white/70">
                                <i class="fas fa-sync-alt mr-1"></i>
                                Refresh
                            </button>
                        </div>
                    </div>
                </header>

                <!-- System Overview Grid -->
                <div class="grid grid-cols-1 lg:grid-cols-3 gap-3 mb-3">
                    <!-- AI Models Status -->
                    <div class="lg:col-span-2">
                        <div class="glass-card rounded-xl p-3 h-48">
                            <div class="flex items-center justify-between mb-2">
                                <h2 class="compact-title text-gradient flex items-center">
                                    <i class="fas fa-brain mr-2 text-blue-600"></i>
                                    AI Models Status
                                </h2>
                                <div class="status-badge {'status-online' if '✅' in ai_status['overall_status'] else 'status-warning' if '⚠️' in ai_status['overall_status'] else 'status-error'} px-2 py-1 rounded-lg font-medium text-xs">
                                    {ai_status['overall_status'].split()[0]}
                                </div>
                            </div>
                            <div class="grid grid-cols-1 md:grid-cols-3 gap-2 h-36 overflow-hidden">
                                {_generate_compact_ai_model_cards(ai_status.get('models', {}))}
                            </div>
                        </div>
                    </div>
                    
                    <!-- Enhanced System Stats -->
                    <div>
                        <div class="glass-card rounded-xl p-3 h-48">
                            <h3 class="compact-title text-gradient flex items-center">
                                <i class="fas fa-tachometer-alt mr-2 text-green-600"></i>
                                System Overview
                            </h3>
                            <div class="space-y-1 h-36 overflow-y-auto scrollbar-thin">
                                <div class="metric-card rounded p-1.5">
                                    <div class="flex items-center justify-between text-xs">
                                        <span class="text-gray-600 flex items-center">
                                            <i class="fas fa-server mr-1 text-blue-500"></i>
                                            Platform:
                                        </span>
                                        <span class="font-medium text-gray-800">{system_info.get('platform', {}).get('system', 'Unknown')}</span>
                                    </div>
                                </div>
                                <div class="metric-card rounded p-1.5">
                                    <div class="flex items-center justify-between text-xs">
                                        <span class="text-gray-600 flex items-center">
                                            <i class="fas fa-clock mr-1 text-purple-500"></i>
                                            Uptime:
                                        </span>
                                        <span class="font-medium text-gray-800">{system_info.get('uptime', {}).get('uptime_formatted', 'Unknown')}</span>
                                    </div>
                                </div>
                                <div class="metric-card rounded p-1.5">
                                    <div class="flex items-center justify-between text-xs">
                                        <span class="text-gray-600 flex items-center">
                                            <i class="fas fa-cog mr-1 text-orange-500"></i>
                                            PID:
                                        </span>
                                        <span class="font-medium text-gray-800">{system_info.get('process', {}).get('pid', 'N/A')}</span>
                                    </div>
                                </div>
                                <div class="metric-card rounded p-1.5">
                                    <div class="flex items-center justify-between text-xs">
                                        <span class="text-gray-600 flex items-center">
                                            <i class="fas fa-file-pdf mr-1 text-red-500"></i>
                                            Documents:
                                        </span>
                                        <span class="font-medium text-gray-800">{len(pdfs)} loaded</span>
                                    </div>
                                </div>
                                <div class="metric-card rounded p-1.5">
                                    <div class="flex items-center justify-between text-xs">
                                        <span class="text-gray-600 flex items-center">
                                            <i class="fas fa-code mr-1 text-cyan-500"></i>
                                            Python:
                                        </span>
                                        <span class="font-medium text-gray-800">{system_info.get('platform', {}).get('python_version', 'Unknown')}</span>
                                    </div>
                                </div>
                                <div class="metric-card rounded p-1.5">
                                    <div class="flex items-center justify-between text-xs">
                                        <span class="text-gray-600 flex items-center">
                                            <i class="fas fa-memory mr-1 text-indigo-500"></i>
                                            Process RAM:
                                        </span>
                                        <span class="font-medium text-gray-800">{system_info.get('process', {}).get('memory_rss_mb', 0):.0f}MB</span>
                                    </div>
                                </div>
                                <div class="metric-card rounded p-1.5">
                                    <div class="flex items-center justify-between text-xs">
                                        <span class="text-gray-600 flex items-center">
                                            <i class="fas fa-microchip mr-1 text-pink-500"></i>
                                            Architecture:
                                        </span>
                                        <span class="font-medium text-gray-800">{system_info.get('platform', {}).get('architecture', 'Unknown')}</span>
                                    </div>
                                </div>
                                <div class="metric-card rounded p-1.5">
                                    <div class="flex items-center justify-between text-xs">
                                        <span class="text-gray-600 flex items-center">
                                            <i class="fas fa-tasks mr-1 text-yellow-500"></i>
                                            Threads:
                                        </span>
                                        <span class="font-medium text-gray-800">{system_info.get('process', {}).get('num_threads', 'N/A')}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Performance Metrics -->
                <div class="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-3">
                    <!-- CPU Metrics -->
                    <div class="glass-card rounded-xl p-3">
                        <div class="flex items-center justify-between mb-2">
                            <h3 class="compact-text font-semibold text-gray-800 flex items-center">
                                <i class="fas fa-microchip mr-1 text-purple-600"></i>
                                CPU
                            </h3>
                            <span class="text-xs text-gray-500">{system_info.get('cpu', {}).get('count', 0)} cores</span>
                        </div>
                        <div class="text-center mb-2">
                            <div class="metric-value text-lg">{system_info.get('cpu', {}).get('usage_percent', 0):.1f}%</div>
                            <div class="metric-label">Usage</div>
                        </div>
                        <div class="progress-bar mb-2">
                            <div class="progress-fill cpu-progress" style="width: {system_info.get('cpu', {}).get('usage_percent', 0)}%"></div>
                        </div>
                        <div class="text-xs text-gray-500 flex justify-between">
                            <span>Freq: {system_info.get('cpu', {}).get('frequency', {}).get('current', 0):.0f}MHz</span>
                            <span>Load: {system_info.get('cpu', {}).get('load_average', [0])[0]:.1f}</span>
                        </div>
                    </div>

                    <!-- Memory Metrics -->
                    <div class="glass-card rounded-xl p-3">
                        <div class="flex items-center justify-between mb-2">
                            <h3 class="compact-text font-semibold text-gray-800 flex items-center">
                                <i class="fas fa-memory mr-1 text-cyan-600"></i>
                                Memory
                            </h3>
                            <span class="text-xs text-gray-500">{system_info.get('memory', {}).get('total_gb', 0):.0f}GB</span>
                        </div>
                        <div class="text-center mb-2">
                            <div class="metric-value text-lg">{system_info.get('memory', {}).get('percentage', 0):.1f}%</div>
                            <div class="metric-label">Used</div>
                        </div>
                        <div class="progress-bar mb-2">
                            <div class="progress-fill memory-progress" style="width: {system_info.get('memory', {}).get('percentage', 0)}%"></div>
                        </div>
                        <div class="text-xs text-gray-500 flex justify-between">
                            <span>Used: {system_info.get('memory', {}).get('used_gb', 0):.1f}GB</span>
                            <span>Free: {system_info.get('memory', {}).get('available_gb', 0):.1f}GB</span>
                        </div>
                    </div>

                    <!-- Disk Metrics -->
                    <div class="glass-card rounded-xl p-3">
                        <div class="flex items-center justify-between mb-2">
                            <h3 class="compact-text font-semibold text-gray-800 flex items-center">
                                <i class="fas fa-hdd mr-1 text-green-600"></i>
                                Storage
                            </h3>
                            <span class="text-xs text-gray-500">{system_info.get('disk', {}).get('total_gb', 0):.0f}GB</span>
                        </div>
                        <div class="text-center mb-2">
                            <div class="metric-value text-lg">{system_info.get('disk', {}).get('percentage', 0):.1f}%</div>
                            <div class="metric-label">Used</div>
                        </div>
                        <div class="progress-bar mb-2">
                            <div class="progress-fill disk-progress" style="width: {system_info.get('disk', {}).get('percentage', 0)}%"></div>
                        </div>
                        <div class="text-xs text-gray-500 flex justify-between">
                            <span>Used: {system_info.get('disk', {}).get('used_gb', 0):.0f}GB</span>
                            <span>Free: {system_info.get('disk', {}).get('free_gb', 0):.0f}GB</span>
                        </div>
                    </div>

                    <!-- Network Metrics -->
                    <div class="glass-card rounded-xl p-3">
                        <div class="flex items-center justify-between mb-2">
                            <h3 class="compact-text font-semibold text-gray-800 flex items-center">
                                <i class="fas fa-network-wired mr-1 text-orange-600"></i>
                                Network
                            </h3>
                            <span class="text-xs text-gray-500">I/O</span>
                        </div>
                        <div class="text-center mb-2">
                            <div class="metric-value text-lg">{system_info.get('network', {}).get('bytes_sent_mb', 0):.0f}</div>
                            <div class="metric-label">MB Sent</div>
                        </div>
                        <div class="text-xs text-gray-500 space-y-1">
                            <div class="flex justify-between">
                                <span>Received:</span>
                                <span>{system_info.get('network', {}).get('bytes_recv_mb', 0):.0f}MB</span>
                            </div>
                            <div class="flex justify-between">
                                <span>Packets:</span>
                                <span>{system_info.get('network', {}).get('packets_sent', 0):,}</span>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Bottom Grid: Documents & API Endpoints -->
                <div class="grid grid-cols-1 lg:grid-cols-2 gap-3 mb-2">
                    <!-- PDF Documents -->
                    <div class="glass-card rounded-xl p-3 h-32">
                        <h3 class="text-sm font-semibold text-gradient flex items-center mb-2">
                            <i class="fas fa-file-pdf mr-2 text-red-600"></i>
                            Document Library
                            <span class="ml-auto text-xs font-normal bg-red-100 px-2 py-1 rounded-full text-red-700">
                                {len(pdfs)} loaded
                            </span>
                        </h3>
                        <div class="space-y-1 h-20 overflow-y-auto scrollbar-thin">
                            {_generate_compact_pdf_list(pdfs)}
                        </div>
                    </div>

                    <!-- API Endpoints with Status -->
                    <div class="glass-card rounded-xl p-3 h-32">
                        <h3 class="text-sm font-semibold text-gradient flex items-center mb-2">
                            <i class="fas fa-plug mr-2 text-emerald-600"></i>
                            API Endpoints Status
                        </h3>
                        <div class="space-y-1 h-20 overflow-y-auto scrollbar-thin">
                            {_generate_api_endpoints_with_status(endpoint_status)}
                        </div>
                    </div>
                </div>

                <!-- Compact Footer -->
                <footer class="text-center">
                    <div class="glass-card rounded-xl p-2">
                        <div class="flex flex-col sm:flex-row items-center justify-between text-gray-600 text-xs">
                            <div class="flex items-center space-x-3 mb-1 sm:mb-0">
                                <i class="fas fa-clock"></i>
                                <span>Updated: {datetime.datetime.now().strftime('%H:%M:%S')} UTC</span>
                            </div>
                            <div class="flex items-center space-x-3">
                                <span>PID: {system_info.get('process', {}).get('pid', 'N/A')}</span>
                                <span>•</span>
                                <span>Threads: {system_info.get('process', {}).get('num_threads', 'N/A')}</span>
                                <span>•</span>
                                <span>Python {system_info.get('platform', {}).get('python_version', 'N/A')}</span>
                            </div>
                        </div>
                    </div>
                </footer>
            </div>
        </div>

        <script>
            // Auto-refresh every 30 seconds
            setTimeout(() => {{
                location.reload();
            }}, 30000);
        </script>
    </body>
    </html>
    """
    return HTMLResponse(content=html_content)

def _generate_compact_ai_model_cards(models: dict) -> str:
    """Generate compact AI model cards for light theme."""
    if not models:
        return """
        <div class='col-span-3 text-center py-6'>
            <i class='fas fa-exclamation-triangle text-2xl text-orange-500 mb-2'></i>
            <p class='text-gray-600 text-sm'>No AI models status available</p>
        </div>
        """
    
    cards = []
    model_names = {"mini": "GPT-4o-Mini", "main": "GPT-4o", "nano": "GPT-4o-Nano"}
    model_icons = {"mini": "fas fa-bolt", "main": "fas fa-brain", "nano": "fas fa-check-circle"}
    model_colors = {"mini": "text-yellow-600", "main": "text-blue-600", "nano": "text-green-600"}
    
    for model_type, model_info in models.items():
        status_icon = "✅" if "✅" in model_info.get("status", "") else "❌"
        status_class = "status-online" if "✅" in model_info.get("status", "") else "status-error"
        response_time = model_info.get('response_time_ms', 0)
        
        # Performance indicator
        if response_time < 1000:
            perf_class = "text-green-600"
            perf_icon = "fas fa-rocket"
        elif response_time < 3000:
            perf_class = "text-yellow-600"
            perf_icon = "fas fa-clock"
        else:
            perf_class = "text-red-600"
            perf_icon = "fas fa-hourglass-half"
        
        card = f"""
        <div class="metric-card rounded-lg p-3">
            <div class="flex items-center justify-between mb-2">
                <h4 class="compact-text font-semibold text-gray-800 flex items-center">
                    <i class="{model_icons.get(model_type, 'fas fa-robot')} mr-1 {model_colors.get(model_type, 'text-blue-600')}"></i>
                    {model_names.get(model_type, model_type.title())}
                </h4>
                <span class="text-xs {status_class if status_icon == '✅' else 'text-red-600'}">{status_icon}</span>
            </div>
            
            <div class="space-y-1">
                <div class="flex justify-between items-center text-xs">
                    <span class="text-gray-500">Model:</span>
                    <span class="text-gray-700 font-medium">{model_info.get('model_name', 'Unknown')[:20]}...</span>
                </div>
                
                <div class="flex justify-between items-center text-xs">
                    <span class="text-gray-500">Response:</span>
                    <span class="text-gray-700 font-medium flex items-center">
                        <i class="{perf_icon} mr-1 {perf_class}"></i>
                        {response_time}ms
                    </span>
                </div>
                
                <div class="text-xs text-gray-500">
                    Functions: {len(model_info.get("functions", []))} available
                </div>
                
                {"<div class='mt-2 p-1 bg-red-50 rounded text-red-600 text-xs'><i class='fas fa-exclamation-triangle mr-1'></i>" + model_info.get('error', '')[:30] + "...</div>" if model_info.get('error') else ""}
            </div>
        </div>
        """
        cards.append(card)
    
    return "".join(cards)

def _generate_compact_pdf_list(pdfs: list) -> str:
    """Generate compact PDF list for light theme."""
    if not pdfs:
        return """
        <div class='text-center py-4'>
            <i class='fas fa-file-pdf text-xl text-red-400 mb-2'></i>
            <p class='text-gray-500 text-xs'>No documents loaded</p>
        </div>
        """
    
    pdf_items = []
    for i, pdf in enumerate(pdfs[:8]):  # Limit to 8 items for compactness
        pdf_name = pdf.split('/')[-1] if '/' in pdf else pdf
        pdf_items.append(f"""
        <div class="api-endpoint rounded p-2 flex items-center justify-between">
            <div class="flex items-center">
                <i class="fas fa-file-pdf mr-2 text-red-500 text-xs"></i>
                <span class="text-gray-700 text-xs font-medium truncate">{pdf_name[:25]}{'...' if len(pdf_name) > 25 else ''}</span>
            </div>
            <span class="text-xs text-gray-400">#{i + 1}</span>
        </div>
        """)
    
    if len(pdfs) > 8:
        pdf_items.append(f"""
        <div class="text-center py-1">
            <span class="text-xs text-gray-500">+{len(pdfs)-8} more documents...</span>
        </div>
        """)
    
    return "".join(pdf_items)

def _generate_api_endpoints_with_status(endpoint_status: dict) -> str:
    """Generate API endpoints with their testing status."""
    if not endpoint_status:
        return """
        <div class='text-center py-4'>
            <i class='fas fa-exclamation-triangle text-xl text-orange-400 mb-2'></i>
            <p class='text-gray-500 text-xs'>Could not test API endpoints</p>
        </div>
        """
    
    endpoint_items = []
    for name, status_info in endpoint_status.items():
        status_icon = status_info.get("status", "❌ Unknown").split()[0]
        
        if "✅" in status_icon:
            status_class = "text-green-600"
            bg_class = "bg-green-50"
        elif "⚠️" in status_icon:
            status_class = "text-yellow-600"
            bg_class = "bg-yellow-50"
        else:
            status_class = "text-red-600"
            bg_class = "bg-red-50"
        
        response_time = status_info.get("response_time", 0)
        status_code = status_info.get("status_code", "")
        error = status_info.get("error", "")
        
        endpoint_items.append(f"""
        <div class="api-endpoint rounded p-2 {bg_class}">
            <div class="flex items-center justify-between">
                <div class="flex items-center">
                    <span class="text-xs {status_class} mr-2">{status_icon}</span>
                    <span class="text-gray-700 text-xs font-medium">{name}</span>
                </div>
                <div class="flex items-center space-x-2">
                    {f'<span class="text-xs text-gray-500">{response_time}ms</span>' if response_time > 0 else ''}
                    {f'<span class="text-xs {status_class}">{status_code}</span>' if status_code else ''}
                </div>
            </div>
            {f'<div class="text-xs text-red-500 mt-1 truncate">{error}</div>' if error else ''}
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