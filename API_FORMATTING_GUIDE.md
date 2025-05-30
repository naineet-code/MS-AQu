# API Response Formatting Guide

## Overview
Both FAQ sites now support rich text formatting for API responses. The backend can send formatted text using Markdown syntax, which will be rendered with enhanced styling on the frontend.

## Supported Formatting

### Basic Text Formatting
- **Bold text**: `**bold text**` or `__bold text__`
- *Italic text*: `*italic text*` or `_italic text_`
- `Inline code`: `` `code snippet` ``

### Headers
```markdown
# H1 Header
## H2 Header
### H3 Header
#### H4 Header
##### H5 Header
###### H6 Header
```

### Lists
```markdown
- Unordered list item 1
- Unordered list item 2
  - Nested item

1. Ordered list item 1
2. Ordered list item 2
   1. Nested item
```

### Links
```markdown
[Link text](https://example.com)
```

### Blockquotes
```markdown
> This is a blockquote
> It can span multiple lines
```

### Code Blocks
````markdown
```
Multi-line code block
Can contain any programming language
```
````

### Tables
```markdown
| Header 1 | Header 2 | Header 3 |
|----------|----------|----------|
| Cell 1   | Cell 2   | Cell 3   |
| Cell 4   | Cell 5   | Cell 6   |
```

## API Response Structure

The backend should continue to use the existing response structure, but can now include Markdown formatting in the following fields:

```json
{
  "answer": "**Main Answer**: This is the primary response with *formatting*\n\n## Key Points\n- Point 1\n- Point 2",
  "reasoning": "### Analysis Process\n1. First step\n2. Second step\n\n**Conclusion**: Based on the analysis...",
  "relevant_paragraphs": [
    {
      "id": "para_1",
      "text": "Paragraph content with **bold** and *italic* text, including `code snippets`",
      "pages": "Page 1-3"
    }
  ],
  "citations": ["para_1"]
}
```

## Theme-Specific Styling

### Reliance Animated FAQ Site
- Headers: Blue color scheme
- Code: Green color scheme
- Emphasis: Yellow for bold, purple for italic
- Links: Blue with hover effects

### Merchandising Module Site
- Headers: Cyan color scheme
- Code: Emerald color scheme
- Emphasis: Amber for bold, purple for italic
- Links: Cyan with hover effects

## Implementation Notes

1. **Automatic Styling**: The frontend automatically applies appropriate CSS classes based on the current theme (light/dark mode)
2. **Responsive**: All formatting is responsive and works across different screen sizes
3. **Accessibility**: Proper semantic HTML is generated with appropriate ARIA attributes
4. **Performance**: Minimal performance impact as processing is done client-side

## Example API Responses

### Simple Response
```json
{
  "answer": "The **WSSI module** helps with inventory planning by analyzing *historical data* and providing forecasts.\n\n### Key Benefits:\n- Improved accuracy\n- Better resource allocation\n- Reduced waste"
}
```

### Complex Response with Formatting
```json
{
  "answer": "# Inventory Management Process\n\nThe system follows a **three-stage approach**:\n\n## 1. Data Collection\n- Historical sales data\n- Current inventory levels\n- Market trends\n\n## 2. Analysis\n```\nCalculation: (Current Stock / Daily Sales Rate) = Days of Coverage\n```\n\n## 3. Recommendations\n> Based on the analysis, we recommend adjusting inventory levels by **15-20%** to optimize coverage.",
  "reasoning": "### Calculation Method\n\nThe system uses the following formula:\n\n`Coverage = Current Stock ÷ Average Daily Sales`\n\nThis provides insights into:\n- **Overstocking risks**\n- *Stockout probabilities*\n- Optimal reorder points"
}
```

## Testing

To test the rich text formatting:

1. Send API responses with various Markdown elements
2. Verify rendering in both light and dark themes
3. Test on different screen sizes
4. Ensure accessibility with screen readers
5. Validate performance with large formatted responses

## Notes for Backend Development

- Use standard Markdown syntax for maximum compatibility
- Avoid overly complex nested structures
- Keep formatting semantic and meaningful
- Test with actual content to ensure readability
- Consider response size when adding extensive formatting

## Redis Caching System

### Overview
The backend now implements an advanced Redis caching system with semantic similarity matching, answer verification, and comprehensive cost tracking. This significantly improves response times and reduces API costs.

### Cache Strategy

#### 1. **Semantic Similarity Matching**
- Uses OpenAI's `text-embedding-ada-002` model to generate embeddings
- Implements cosine similarity to find semantically similar cached queries
- Default similarity threshold: 0.85 (configurable)
- Cache keys: MD5 hash of query+category combination

#### 2. **Answer Verification**
- Cached answers are verified using GPT Nano model
- Returns confidence scores (0-100%) for relevance
- Automatically removes invalid/outdated cache entries
- Ensures cached responses remain accurate over time

#### 3. **Cost Optimization**
- ~90% cost reduction for cache hits
- ~50x faster response times from cache
- Transparent cost tracking for all operations
- Detailed breakdown by operation type

### API Request Parameters

#### Query Endpoint (`POST /api/query`)
```json
{
  "query": "string",
  "category": "string",
  "force_no_cache": boolean  // Optional, defaults to false
}
```

#### Force No Cache Parameter
- `force_no_cache`: When set to `true`, bypasses cache completely
- Useful for generating fresh responses when needed
- Frontend displays a subtle refresh button for cached responses

### Enhanced Response Structure

The API response now includes additional cache-related information:

```json
{
  "answer": "**Main Answer**: This is the primary response with *formatting*",
  "reasoning": "### Analysis Process\n1. First step\n2. Second step",
  "relevant_paragraphs": [...],
  "citations": [...],
  
  // Cache Information
  "cache_hit": true,
  "similarity_score": 0.92,
  "verification": {
    "confidence": 95,
    "reason": "High relevance match"
  },
  "forced_no_cache": false,
  
  // Cost Information
  "cost": {
    "total": 0.0234,
    "breakdown": {
      "embedding": 0.0001,
      "verification": 0.0005,
      "generation": 0.0228
    }
  },
  
  // Performance Metrics
  "response_time_ms": 145,
  "tokens_used": {
    "prompt": 1250,
    "completion": 320,
    "total": 1570
  }
}
```

### Cache Status Indicators

The frontend displays cache status with visual indicators:
- **🚀 Cached**: Response served from cache
- **✨ Fresh**: Newly generated response
- **🔄 Refreshed**: Force no-cache was used
- **Similarity %**: Shows match percentage for cached responses
- **Confidence Score**: Verification confidence level

### Cache Configuration

#### Environment Variables
```bash
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_DB=0
REDIS_PASSWORD=optional
CACHE_TTL=3600                    # Cache lifetime in seconds (default: 1 hour)
CACHE_SIMILARITY_THRESHOLD=0.85    # Similarity threshold (0-1)
```

### Administrative Endpoints

#### Cache Statistics (`GET /api/ai-status`)
Returns comprehensive cache statistics:
```json
{
  "cache": {
    "status": "connected",
    "performance": {
      "hit_rate": 78.5,
      "total_queries": 142,
      "cache_hits": 112,
      "cache_misses": 30
    },
    "memory": {
      "used_memory_human": "2.1MB",
      "used_memory_mb": 2.1
    },
    "config": {
      "ttl": 3600,
      "similarity_threshold": 0.85
    }
  }
}
```

#### Clear Cache (`POST /api/clear-cache`)
Clears all cached responses (requires admin authentication in production).

#### Download Logs (`GET /api/download-question-logs`)
Downloads comprehensive CSV file with:
- All question logs with cache statistics
- Current cache contents
- Performance metrics
- Cost breakdown

### Cache Flow Example

1. **User submits question**: "What is WSSI?"
2. **Embedding generation**: Create embedding using Ada model (~$0.0001)
3. **Similarity search**: Find similar cached queries in Redis
4. **Match found**: Query "What does WSSI mean?" with 0.91 similarity
5. **Verification**: Check relevance using Nano model (~$0.0005)
6. **Response**: Return cached answer with cache status
7. **Total cost**: ~$0.0006 vs ~$0.023 for fresh generation

### Frontend Integration

#### Displaying Cache Status
```typescript
// Response includes cache information
if (response.cache_hit) {
  showCacheIndicator(response.similarity_score, response.verification);
  showForceRefreshButton();
}
```

#### Force Refresh Request
```typescript
// User clicks refresh button
const freshResponse = await fetch('/api/query', {
  method: 'POST',
  body: JSON.stringify({
    query: "What is WSSI?",
    category: "reliance",
    force_no_cache: true  // Bypass cache
  })
});
```

### Performance Guidelines

1. **Cache-Friendly Queries**: Encourage consistent phrasing for better cache hits
2. **Category Usage**: Always specify correct category for optimal caching
3. **Monitoring**: Use dashboard to monitor cache performance
4. **TTL Configuration**: Adjust based on content update frequency
5. **Threshold Tuning**: Lower threshold for more cache hits, higher for accuracy

### Cost Tracking Details

The system tracks costs for:
- **Embedding Generation**: Ada model costs for creating query embeddings
- **Similarity Search**: Minimal Redis operation costs
- **Answer Verification**: Nano model costs for relevance checking
- **Fresh Generation**: Full GPT-4 costs when cache miss occurs

Cost breakdown helps understand:
- True savings from caching
- API usage patterns
- Optimization opportunities
- Budget planning

### Troubleshooting

Common issues and solutions:
1. **Low Cache Hit Rate**: Adjust similarity threshold or review query patterns
2. **Stale Responses**: Reduce TTL or implement content-based invalidation
3. **High Verification Failures**: Review document updates or model changes
4. **Memory Issues**: Monitor Redis memory usage and implement eviction policies

### Best Practices

1. **Query Normalization**: Consistent formatting improves cache hits
2. **Category Selection**: Accurate categories ensure relevant caching
3. **Cache Warming**: Pre-cache common questions during low-traffic periods
4. **Monitoring**: Regular review of cache statistics and logs
5. **User Experience**: Transparent cache indicators build trust