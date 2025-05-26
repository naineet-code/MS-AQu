from dotenv import load_dotenv
load_dotenv()

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import HTMLResponse, FileResponse
from fastapi.staticfiles import StaticFiles
from config.logging_config import setup_logging, get_logger
from config.settings import Settings
from core.pdf_manager import PDFManager
from api.routes import router as api_router
import uvicorn
import psutil
import platform
import datetime
import os
from pathlib import Path

# Initialize logging
setup_logging()
logger = get_logger(__name__)

# Initialize settings
settings = Settings()
if not settings.validate():
    raise RuntimeError("Invalid configuration")

# Initialize PDF manager
pdf_manager = PDFManager(settings.get("PDF_DIR"))
pdf_manager.load_pdfs()

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
app.include_router(api_router, prefix="/api")

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

def get_system_info():
    """Get system information for status page."""
    return {
        "platform": platform.platform(),
        "python_version": platform.python_version(),
        "cpu_usage": psutil.cpu_percent(),
        "memory_usage": psutil.virtual_memory().percent,
        "disk_usage": psutil.disk_usage('/').percent,
        "uptime": str(datetime.timedelta(seconds=int(psutil.boot_time()))),
        "process_info": {
            "pid": os.getpid(),
            "memory_info": dict(psutil.Process(os.getpid()).memory_info()._asdict()),
            "cpu_percent": psutil.Process(os.getpid()).cpu_percent()
        }
    }

@app.get("/", response_class=HTMLResponse)
async def status_page():
    """Render the status page."""
    system_info = get_system_info()
    pdfs = list(pdf_manager.pdf_cache.keys())
    
    html_content = f"""
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>AQu API Status</title>
        <link href="https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/tailwind.min.css" rel="stylesheet">
        <style>
            .status-card {{
                backdrop-filter: blur(10px);
                background-color: rgba(255, 255, 255, 0.1);
            }}
            .dark .status-card {{
                background-color: rgba(17, 24, 39, 0.7);
            }}
        </style>
    </head>
    <body class="bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 min-h-screen">
        <div class="container mx-auto px-4 py-8">
            <header class="text-center mb-12">
                <h1 class="text-4xl font-bold text-gray-800 dark:text-white mb-2">AQu API Status</h1>
                <p class="text-gray-600 dark:text-gray-300">AI-powered Question Answering System</p>
            </header>

            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <!-- System Status -->
                <div class="status-card rounded-lg shadow-lg p-6 border border-gray-200 dark:border-gray-700">
                    <h2 class="text-xl font-semibold text-gray-800 dark:text-white mb-4">System Status</h2>
                    <div class="space-y-3">
                        <div class="flex justify-between">
                            <span class="text-gray-600 dark:text-gray-300">Platform:</span>
                            <span class="text-gray-800 dark:text-white">{system_info['platform']}</span>
                        </div>
                        <div class="flex justify-between">
                            <span class="text-gray-600 dark:text-gray-300">Python Version:</span>
                            <span class="text-gray-800 dark:text-white">{system_info['python_version']}</span>
                        </div>
                        <div class="flex justify-between">
                            <span class="text-gray-600 dark:text-gray-300">Uptime:</span>
                            <span class="text-gray-800 dark:text-white">{system_info['uptime']}</span>
                        </div>
                    </div>
                </div>

                <!-- Resource Usage -->
                <div class="status-card rounded-lg shadow-lg p-6 border border-gray-200 dark:border-gray-700">
                    <h2 class="text-xl font-semibold text-gray-800 dark:text-white mb-4">Resource Usage</h2>
                    <div class="space-y-3">
                        <div class="flex justify-between">
                            <span class="text-gray-600 dark:text-gray-300">CPU Usage:</span>
                            <span class="text-gray-800 dark:text-white">{system_info['cpu_usage']}%</span>
                        </div>
                        <div class="flex justify-between">
                            <span class="text-gray-600 dark:text-gray-300">Memory Usage:</span>
                            <span class="text-gray-800 dark:text-white">{system_info['memory_usage']}%</span>
                        </div>
                        <div class="flex justify-between">
                            <span class="text-gray-600 dark:text-gray-300">Disk Usage:</span>
                            <span class="text-gray-800 dark:text-white">{system_info['disk_usage']}%</span>
                        </div>
                    </div>
                </div>

                <!-- PDF Status -->
                <div class="status-card rounded-lg shadow-lg p-6 border border-gray-200 dark:border-gray-700">
                    <h2 class="text-xl font-semibold text-gray-800 dark:text-white mb-4">PDF Status</h2>
                    <div class="space-y-3">
                        <div class="flex justify-between">
                            <span class="text-gray-600 dark:text-gray-300">Loaded PDFs:</span>
                            <span class="text-gray-800 dark:text-white">{len(pdfs)}</span>
                        </div>
                        <div class="space-y-2">
                            <span class="text-gray-600 dark:text-gray-300">Available PDFs:</span>
                            <ul class="list-disc list-inside text-gray-800 dark:text-white">
                                {''.join(f'<li>{pdf}</li>' for pdf in pdfs)}
                            </ul>
                        </div>
                    </div>
                </div>

                <!-- Process Info -->
                <div class="status-card rounded-lg shadow-lg p-6 border border-gray-200 dark:border-gray-700">
                    <h2 class="text-xl font-semibold text-gray-800 dark:text-white mb-4">Process Info</h2>
                    <div class="space-y-3">
                        <div class="flex justify-between">
                            <span class="text-gray-600 dark:text-gray-300">PID:</span>
                            <span class="text-gray-800 dark:text-white">{system_info['process_info']['pid']}</span>
                        </div>
                        <div class="flex justify-between">
                            <span class="text-gray-600 dark:text-gray-300">Process CPU:</span>
                            <span class="text-gray-800 dark:text-white">{system_info['process_info']['cpu_percent']}%</span>
                        </div>
                        <div class="flex justify-between">
                            <span class="text-gray-600 dark:text-gray-300">Process Memory:</span>
                            <span class="text-gray-800 dark:text-white">{system_info['process_info']['memory_info']['rss'] / 1024 / 1024:.2f} MB</span>
                        </div>
                    </div>
                </div>

                <!-- API Status -->
                <div class="status-card rounded-lg shadow-lg p-6 border border-gray-200 dark:border-gray-700">
                    <h2 class="text-xl font-semibold text-gray-800 dark:text-white mb-4">API Status</h2>
                    <div class="space-y-3">
                        <div class="flex justify-between">
                            <span class="text-gray-600 dark:text-gray-300">Status:</span>
                            <span class="text-green-500 font-semibold">Operational</span>
                        </div>
                        <div class="flex justify-between">
                            <span class="text-gray-600 dark:text-gray-300">Version:</span>
                            <span class="text-gray-800 dark:text-white">1.0.0</span>
                        </div>
                        <div class="flex justify-between">
                            <span class="text-gray-600 dark:text-gray-300">API Docs:</span>
                            <a href="/docs" class="text-blue-500 hover:text-blue-600">Swagger UI</a>
                        </div>
                    </div>
                </div>
            </div>

            <footer class="mt-12 text-center text-gray-600 dark:text-gray-400">
                <p>Last updated: {datetime.datetime.now().strftime('%Y-%m-%d %H:%M:%S')}</p>
            </footer>
        </div>
    </body>
    </html>
    """
    return html_content

@app.on_event("shutdown")
async def shutdown_event():
    """Clean up resources on shutdown."""
    pdf_manager.close_all()

if __name__ == "__main__":
    uvicorn.run(
        "app:app",
        host="0.0.0.0",
        port=8000,
        reload=True
    ) 