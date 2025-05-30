"""Redis configuration settings."""

REDIS_CONFIG = {
    "REDIS_HOST": "localhost",
    "REDIS_PORT": 6379,
    "REDIS_DB": 0,
    "REDIS_PASSWORD": None,
    "CACHE_TTL": 3600,  # 1 hour in seconds
    "CACHE_SIMILARITY_THRESHOLD": 0.80,  # Minimum similarity score for cache hits
} 