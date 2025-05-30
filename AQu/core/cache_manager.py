import redis
import json
import hashlib
import time
import re
from typing import Optional, Dict, Any, List, Tuple
from difflib import SequenceMatcher
from config.settings import Settings
from config.logging_config import get_logger
from openai import AzureOpenAI

logger = get_logger(__name__)

class SmartCacheManager:
    def __init__(self):
        self.settings = Settings()
        self.redis_host = self.settings.get("REDIS_HOST", "localhost")
        self.redis_port = int(self.settings.get("REDIS_PORT", 6379))
        self.redis_db = int(self.settings.get("REDIS_DB", 0))
        self.redis_password = self.settings.get("REDIS_PASSWORD", None)
        self.cache_ttl = int(self.settings.get("CACHE_TTL", 3600))  # Default 1 hour TTL
        
        # Multi-layer matching thresholds
        self.exact_match_threshold = 0.95  # Near-exact matches
        self.fuzzy_match_threshold = float(self.settings.get("CACHE_SIMILARITY_THRESHOLD", 0.80))  # Fuzzy matches
        self.nano_verification_enabled = self.settings.get("CACHE_NANO_VERIFICATION", "false").lower() == "true"
        self.nano_verification_threshold = 0.70  # When to ask nano for verification
        
        # Initialize OpenAI client for optional nano verification
        if self.nano_verification_enabled:
            self.nano_client = AzureOpenAI(
                api_key=self.settings.get("AZURE_OPENAI_API_KEY_NANO"),
                api_version=self.settings.get("AZURE_OPENAI_API_VERSION_NANO"),
                azure_endpoint=self.settings.get("AZURE_OPENAI_ENDPOINT_NANO"),
                default_headers={"api-key": self.settings.get("AZURE_OPENAI_API_KEY_NANO")}
            )
        else:
            self.nano_client = None
        
        # Common stop words for query normalization
        self.stop_words = {
            'a', 'an', 'and', 'are', 'as', 'at', 'be', 'by', 'for', 'from', 'has', 'he', 'in', 'is', 'it',
            'its', 'of', 'on', 'that', 'the', 'to', 'was', 'will', 'with', 'what', 'where', 'when', 'why',
            'how', 'who', 'which', 'can', 'could', 'should', 'would', 'do', 'does', 'did', 'have', 'had'
        }
        
        # Common question patterns and synonyms
        self.query_synonyms = {
            'what is': ['what are', 'define', 'explain', 'tell me about'],
            'how to': ['how do i', 'how can i', 'steps to', 'process to'],
            'difference': ['diff', 'compare', 'comparison', 'vs', 'versus'],
            'list': ['show', 'give me', 'provide', 'enumerate'],
            'benefits': ['advantages', 'pros', 'good points'],
            'problems': ['issues', 'disadvantages', 'cons', 'bad points']
        }
        
        try:
            self.redis_client = redis.Redis(
                host=self.redis_host,
                port=self.redis_port,
                db=self.redis_db,
                password=self.redis_password,
                decode_responses=True
            )
            # Test connection
            self.redis_client.ping()
            logger.info("Successfully connected to Redis")
        except Exception as e:
            logger.error(f"Failed to connect to Redis: {str(e)}")
            self.redis_client = None

    def _normalize_query(self, query: str) -> str:
        """Advanced query normalization for better matching."""
        # Convert to lowercase
        normalized = query.lower().strip()
        
        # Remove extra whitespace and punctuation
        normalized = re.sub(r'[^\w\s]', ' ', normalized)
        normalized = re.sub(r'\s+', ' ', normalized)
        
        # Split into words
        words = normalized.split()
        
        # Remove stop words but keep important question words
        important_question_words = {'what', 'how', 'when', 'where', 'why', 'which', 'who'}
        filtered_words = []
        for word in words:
            if word not in self.stop_words or word in important_question_words:
                filtered_words.append(word)
        
        # Apply synonym normalization
        normalized_text = ' '.join(filtered_words)
        for canonical, synonyms in self.query_synonyms.items():
            for synonym in synonyms:
                normalized_text = normalized_text.replace(synonym, canonical)
        
        return normalized_text.strip()

    def _extract_keywords(self, query: str) -> List[str]:
        """Extract key terms from a query for keyword-based matching."""
        normalized = self._normalize_query(query)
        words = normalized.split()
        
        # Filter out very short words and prioritize longer, more meaningful terms
        keywords = [word for word in words if len(word) > 2]
        
        # Sort by length (longer words are usually more specific)
        keywords.sort(key=len, reverse=True)
        
        return keywords

    def _calculate_text_similarity(self, query1: str, query2: str) -> float:
        """Calculate similarity between two queries using multiple methods."""
        # Normalize both queries
        norm_q1 = self._normalize_query(query1)
        norm_q2 = self._normalize_query(query2)
        
        # Method 1: Exact normalized match
        if norm_q1 == norm_q2:
            return 1.0
        
        # Method 2: Sequence similarity
        seq_similarity = SequenceMatcher(None, norm_q1, norm_q2).ratio()
        
        # Method 3: Keyword overlap
        keywords1 = set(self._extract_keywords(query1))
        keywords2 = set(self._extract_keywords(query2))
        
        if not keywords1 or not keywords2:
            keyword_similarity = 0.0
        else:
            intersection = keywords1.intersection(keywords2)
            union = keywords1.union(keywords2)
            keyword_similarity = len(intersection) / len(union) if union else 0.0
        
        # Method 4: Token-based similarity (order-independent)
        tokens1 = set(norm_q1.split())
        tokens2 = set(norm_q2.split())
        
        if not tokens1 or not tokens2:
            token_similarity = 0.0
        else:
            token_intersection = tokens1.intersection(tokens2)
            token_union = tokens1.union(tokens2)
            token_similarity = len(token_intersection) / len(token_union) if token_union else 0.0
        
        # Weighted combination of all methods
        combined_similarity = (
            seq_similarity * 0.3 +          # Sequential similarity
            keyword_similarity * 0.4 +       # Keyword overlap (most important)
            token_similarity * 0.3           # Token overlap
        )
        
        return combined_similarity

    def _verify_with_nano(self, query: str, cached_query: str, cached_answer: str) -> Dict[str, Any]:
        """Use GPT Nano to verify if a cached answer is relevant for the current query."""
        if not self.nano_client:
            return {"is_valid": False, "confidence": 0, "reason": "Nano verification disabled"}
        
        try:
            verification_prompt = f"""Compare these two questions and determine if they are asking for the same information:

Original Question: "{cached_query}"
New Question: "{query}"

Consider:
1. Are they asking about the same topic/concept?
2. Would the same answer satisfy both questions?
3. Are they semantically equivalent despite different wording?

Respond in JSON format:
{{"is_valid": true/false, "confidence": 0-100, "reason": "brief explanation"}}"""

            response = self.nano_client.chat.completions.create(
                model=self.settings.get("AZURE_OPENAI_DEPLOYMENT_NANO"),
                messages=[
                    {"role": "system", "content": "You are a query similarity expert. Always respond in valid JSON format."},
                    {"role": "user", "content": verification_prompt}
                ],
                temperature=0.1,
                max_tokens=100,
                response_format={"type": "json_object"}
            )
            
            verification = json.loads(response.choices[0].message.content.strip())
            verification['nano_cost'] = self._calculate_nano_cost(response.usage.prompt_tokens, response.usage.completion_tokens)
            logger.info(f"Nano verification for '{query}' vs '{cached_query}': {verification}")
            return verification
            
        except Exception as e:
            logger.error(f"Error in nano verification: {str(e)}")
            return {
                "is_valid": False,
                "confidence": 0,
                "reason": f"Verification error: {str(e)}",
                "nano_cost": {"input_tokens": 0, "output_tokens": 0, "cost": 0}
            }

    def _calculate_nano_cost(self, input_tokens: int, output_tokens: int) -> Dict[str, float]:
        """Calculate cost for nano model usage."""
        # Load pricing from config
        try:
            with open("config/config.json", "r") as f:
                pricing_config = json.load(f)["MODEL_PRICING"]
                nano_pricing = pricing_config.get("ai-4.1-nano", {
                    "input": 0.25,    # Default fallback values (per million tokens)
                    "output": 1.00
                })
        except:
            # Fallback to default values if config can't be loaded
            nano_pricing = {
                "input": 0.25,    # per million tokens
                "output": 1.00    # per million tokens
            }
        
        # Calculate costs per million tokens (matching ai_service.py pattern)
        input_cost = (input_tokens / 1_000_000) * nano_pricing["input"]
        output_cost = (output_tokens / 1_000_000) * nano_pricing["output"]
        total_cost = input_cost + output_cost
        
        return {
            "input_tokens": input_tokens,
            "output_tokens": output_tokens,
            "cost": round(total_cost, 6),
            "model": "ai-4.1-nano"
        }

    def _generate_cache_key(self, query: str, category: str) -> str:
        """Generate a cache key using normalized query hash."""
        normalized_query = self._normalize_query(query)
        query_hash = hashlib.md5(normalized_query.encode()).hexdigest()
        return f"query:{category}:{query_hash}"

    def get_cached_response(self, query: str, category: str, force_no_cache: bool = False) -> Optional[Dict[str, Any]]:
        """Smart multi-layer cache lookup."""
        if not self.redis_client or force_no_cache:
            if force_no_cache:
                logger.info(f"Cache bypass requested for query: {query}")
            return None

        try:
            # Layer 1: Try exact normalized match first
            cache_key = self._generate_cache_key(query, category)
            cached_data = self.redis_client.get(cache_key)
            
            if cached_data:
                cached_item = json.loads(cached_data)
                logger.info(f"Layer 1 (Exact) cache hit for query: {query}")
                cached_item['cache_hit'] = True
                cached_item['match_type'] = 'exact'
                cached_item['similarity_score'] = 1.0
                return cached_item

            # Layer 2: Fuzzy matching against all cached queries in category
            pattern = f"query:{category}:*"
            cache_keys = self.redis_client.keys(pattern)
            
            best_similarity = 0.0
            best_response = None
            best_key = None
            best_original_query = None

            for key in cache_keys:
                cached_data = self.redis_client.get(key)
                if cached_data:
                    cached_item = json.loads(cached_data)
                    original_query = cached_item.get('original_query', '')
                    
                    if original_query:
                        similarity = self._calculate_text_similarity(query, original_query)
                        
                        if similarity > best_similarity:
                            best_similarity = similarity
                            best_response = cached_item
                            best_key = key
                            best_original_query = original_query

            # Check if we found a good fuzzy match
            if best_response and best_similarity >= self.fuzzy_match_threshold:
                logger.info(f"Layer 2 (Fuzzy) cache hit for query: {query} (similarity: {best_similarity:.2f})")
                best_response['cache_hit'] = True
                best_response['match_type'] = 'fuzzy'
                best_response['similarity_score'] = best_similarity
                best_response['matched_query'] = best_original_query
                return best_response

            # Layer 3: Nano verification for borderline cases (optional)
            if (self.nano_verification_enabled and best_response and 
                best_similarity >= self.nano_verification_threshold):
                
                verification = self._verify_with_nano(query, best_original_query, best_response.get('answer', ''))
                
                if verification.get('is_valid', False) and verification.get('confidence', 0) >= 70:
                    logger.info(f"Layer 3 (Nano) cache hit for query: {query} (confidence: {verification['confidence']}%)")
                    best_response['cache_hit'] = True
                    best_response['match_type'] = 'nano_verified'
                    best_response['similarity_score'] = best_similarity
                    best_response['nano_verification'] = verification
                    best_response['matched_query'] = best_original_query
                    return best_response
                else:
                    logger.info(f"Nano verification failed for query: {query} (confidence: {verification['confidence']}%)")

            logger.info(f"Cache miss for query: {query} (best similarity: {best_similarity:.2f})")
            return None
            
        except Exception as e:
            logger.error(f"Error retrieving from cache: {str(e)}")
            return None

    def cache_response(self, query: str, category: str, response: Dict[str, Any]) -> bool:
        """Cache a response with metadata."""
        if not self.redis_client:
            return False

        try:
            cache_key = self._generate_cache_key(query, category)
            
            # Add cache metadata
            response['cache_hit'] = False
            response['cached_at'] = time.time()
            response['original_query'] = query
            response['normalized_query'] = self._normalize_query(query)
            response['keywords'] = self._extract_keywords(query)
            
            # Store in Redis with TTL
            self.redis_client.setex(
                cache_key,
                self.cache_ttl,
                json.dumps(response, default=str)
            )
            logger.info(f"Cached response for query: {query}")
            return True
        except Exception as e:
            logger.error(f"Error caching response: {str(e)}")
            return False

    def clear_cache(self) -> bool:
        """Clear all cached responses."""
        if not self.redis_client:
            return False

        try:
            self.redis_client.flushdb()
            logger.info("Cache cleared successfully")
            return True
        except Exception as e:
            logger.error(f"Error clearing cache: {str(e)}")
            return False

    def get_cache_stats(self) -> Dict[str, Any]:
        """Get comprehensive cache statistics."""
        if not self.redis_client:
            return {
                "status": "disconnected",
                "total_keys": 0,
                "memory_usage": 0,
                "hit_rate": 0,
                "total_queries": 0,
                "cache_hits": 0,
                "cache_misses": 0
            }

        try:
            info = self.redis_client.info()
            hit_miss_stats = self._get_hit_miss_stats()
            cache_keys = self.redis_client.keys("query:*")
            total_cached_items = len(cache_keys)
            memory_usage_bytes = info.get('used_memory', 0)
            memory_usage_mb = round(memory_usage_bytes / (1024 * 1024), 2)
            
            return {
                "status": "connected",
                "connection": {
                    "host": self.redis_host,
                    "port": self.redis_port,
                    "db": self.redis_db
                },
                "memory": {
                    "used_memory_human": info.get('used_memory_human', '0B'),
                    "used_memory_mb": memory_usage_mb
                },
                "cache_items": {
                    "total_keys": info.get('db0', {}).get('keys', 0),
                    "cached_queries": total_cached_items
                },
                "performance": {
                    "hit_rate": hit_miss_stats.get('hit_rate', 0),
                    "total_queries": hit_miss_stats.get('total_queries', 0),
                    "cache_hits": hit_miss_stats.get('cache_hits', 0),
                    "cache_misses": hit_miss_stats.get('cache_misses', 0)
                },
                "configuration": {
                    "cache_ttl": self.cache_ttl,
                    "fuzzy_threshold": self.fuzzy_match_threshold,
                    "nano_verification": self.nano_verification_enabled,
                    "nano_threshold": self.nano_verification_threshold
                },
                "match_types": self._get_match_type_stats()
            }
        except Exception as e:
            logger.error(f"Error getting cache stats: {str(e)}")
            return {"status": "error", "error": str(e)}

    def _get_hit_miss_stats(self) -> Dict[str, Any]:
        """Calculate cache hit/miss statistics from question logs."""
        try:
            hit_count = 0
            miss_count = 0
            total_count = 0
            
            try:
                with open("question_log.jsonl", "r") as f:
                    for line in f:
                        if line.strip():
                            try:
                                log_entry = json.loads(line.strip())
                                total_count += 1
                                if log_entry.get('cache_hit', False):
                                    hit_count += 1
                                else:
                                    miss_count += 1
                            except json.JSONDecodeError:
                                continue
            except FileNotFoundError:
                logger.warning("Question log file not found")
                
            hit_rate = (hit_count / total_count * 100) if total_count > 0 else 0
            
            return {
                "total_queries": total_count,
                "cache_hits": hit_count,
                "cache_misses": miss_count,
                "hit_rate": round(hit_rate, 2)
            }
        except Exception as e:
            logger.error(f"Error calculating hit/miss stats: {str(e)}")
            return {"total_queries": 0, "cache_hits": 0, "cache_misses": 0, "hit_rate": 0}

    def _get_match_type_stats(self) -> Dict[str, int]:
        """Get statistics on different types of cache matches."""
        try:
            match_types = {"exact": 0, "fuzzy": 0, "nano_verified": 0}
            
            try:
                with open("question_log.jsonl", "r") as f:
                    for line in f:
                        if line.strip():
                            try:
                                log_entry = json.loads(line.strip())
                                if log_entry.get('cache_hit', False):
                                    match_type = log_entry.get('match_type', 'unknown')
                                    if match_type in match_types:
                                        match_types[match_type] += 1
                            except json.JSONDecodeError:
                                continue
            except FileNotFoundError:
                pass
                
            return match_types
        except Exception as e:
            logger.error(f"Error calculating match type stats: {str(e)}")
            return {"exact": 0, "fuzzy": 0, "nano_verified": 0}

    def get_cache_entries_for_export(self) -> List[Dict[str, Any]]:
        """Get all cache entries for CSV export."""
        if not self.redis_client:
            return []
        
        try:
            cache_entries = []
            cache_keys = self.redis_client.keys("query:*")
            
            for key in cache_keys:
                cached_data = self.redis_client.get(key)
                if cached_data:
                    try:
                        cached_item = json.loads(cached_data)
                        cache_entries.append({
                            "cache_key": key,
                            "original_query": cached_item.get('original_query', ''),
                            "normalized_query": cached_item.get('normalized_query', ''),
                            "keywords": ', '.join(cached_item.get('keywords', [])),
                            "cached_at": cached_item.get('cached_at', 0),
                            "answer_preview": cached_item.get('answer', '')[:100] + "...",
                            "ttl": self.redis_client.ttl(key)
                        })
                    except json.JSONDecodeError:
                        continue
                        
            return cache_entries
        except Exception as e:
            logger.error(f"Error getting cache entries for export: {str(e)}")
            return []

# Backwards compatibility alias
RedisCacheManager = SmartCacheManager 