# Deployment Checklist

## Pre-deployment Checks

### Environment Setup
- [ ] Create and activate virtual environment
- [ ] Install all dependencies from requirements.txt
- [ ] Copy and configure .env file
- [ ] Verify all environment variables are set
- [ ] Configure Redis connection settings
- [ ] Test Redis connectivity

### Redis Setup
- [ ] Install and start Redis server
- [ ] Configure Redis persistence (if required)
- [ ] Set Redis memory limits
- [ ] Test Redis connection: `redis-cli ping`
- [ ] Verify Redis password (if set)
- [ ] Configure Redis backup strategy

### GPT-4.1 Model Configuration
- [ ] Configure GPT-4.1 Mini deployment for reasoning
- [ ] Configure GPT-4.1 Main deployment for answer generation
- [ ] Configure GPT-4.1 Nano deployment for verification
- [ ] Test all three model endpoints
- [ ] Verify pricing configuration in config.json

### PDF Migration
- [ ] Run PDF migration script
- [ ] Verify PDFs are in correct directories
- [ ] Check PDF file permissions
- [ ] Validate PDF content

### Code Review
- [ ] Review all configuration files
- [ ] Check API endpoints
- [ ] Verify error handling
- [ ] Test logging configuration
- [ ] Review cache configuration (TTL, similarity threshold)
- [ ] Verify text similarity algorithms are working
- [ ] Check query normalization logic

## Deployment Steps

### Backend Deployment
1. [ ] Stop existing services
2. [ ] Backup current deployment
3. [ ] Backup Redis data (if persistent)
4. [ ] Deploy new code
5. [ ] Run database migrations (if any)
6. [ ] Clear Redis cache if schema changed
7. [ ] Start new services
8. [ ] Verify service health
9. [ ] Check Redis connection status

### Frontend Updates
1. [ ] Update API endpoints in both frontends
2. [ ] Test frontend-backend communication
3. [ ] Verify PDF loading
4. [ ] Check response formatting

## Post-deployment Verification

### API Testing
- [ ] Test /api/query endpoint
- [ ] Test /api/analyze endpoint
- [ ] Test /api/pdfs endpoint
- [ ] Verify error responses
- [ ] Test /api/ai-status endpoint
- [ ] Test cache hit/miss scenarios
- [ ] Verify force_no_cache parameter
- [ ] Test /api/clear-cache endpoint
- [ ] Test /api/download-question-logs endpoint

### Cache Testing
- [ ] Verify cache hit rate
- [ ] Test text similarity matching (Layer 1: exact, Layer 2: fuzzy)
- [ ] Test GPT-4.1 Nano verification (Layer 3) if enabled
- [ ] Validate query normalization and keyword extraction
- [ ] Check cost tracking accuracy
- [ ] Monitor cache memory usage
- [ ] Test cache TTL expiration
- [ ] Verify similarity threshold effectiveness (default: 0.80)

### Frontend Testing
- [ ] Test Reliance frontend
  - [ ] PDF loading
  - [ ] Question submission
  - [ ] Response display
  - [ ] Error handling
- [ ] Test Merchandising frontend
  - [ ] PDF loading
  - [ ] Question submission
  - [ ] Response display
  - [ ] Error handling

### Performance Testing
- [ ] Check response times
- [ ] Monitor memory usage
- [ ] Verify PDF caching
- [ ] Test concurrent requests
- [ ] Compare cached vs non-cached response times
- [ ] Monitor Redis memory consumption
- [ ] Test cache performance under load

### Logging Verification
- [ ] Check log file creation
- [ ] Verify log rotation
- [ ] Test error logging
- [ ] Monitor application logs
- [ ] Verify cache statistics logging
- [ ] Check question_log.jsonl creation

## Rollback Plan

### If Issues Occur
1. [ ] Stop new services
2. [ ] Restore previous deployment
3. [ ] Restore Redis backup (if needed)
4. [ ] Clear corrupted cache entries
5. [ ] Start previous services
6. [ ] Verify system stability

### Emergency Contacts
- [ ] List key personnel
- [ ] Document escalation procedures
- [ ] Share contact information

## Monitoring

### System Health
- [ ] Set up monitoring alerts
- [ ] Configure error notifications
- [ ] Establish performance baselines
- [ ] Document monitoring procedures
- [ ] Monitor Redis connection status
- [ ] Track cache hit rates
- [ ] Alert on low cache performance

### Cache Monitoring
- [ ] Daily cache hit rate review
- [ ] Weekly cost savings analysis
- [ ] Monitor similarity threshold effectiveness (text-based algorithms)
- [ ] Track GPT-4.1 Nano verification confidence scores
- [ ] Review force_no_cache usage patterns
- [ ] Monitor text similarity algorithm performance

### Model Performance Monitoring  
- [ ] Track GPT-4.1 Mini response times (reasoning)
- [ ] Monitor GPT-4.1 Main performance (answer generation)
- [ ] Check GPT-4.1 Nano verification accuracy
- [ ] Review cost per operation across all models
- [ ] Monitor token usage patterns

### Regular Checks
- [ ] Daily log review
- [ ] Weekly performance analysis
- [ ] Monthly system audit
- [ ] Quarterly security review

## Documentation

### Update Required
- [ ] API documentation
- [ ] Deployment procedures
- [ ] Troubleshooting guide
- [ ] User manual

### Archive
- [ ] Previous deployment artifacts
- [ ] Old configuration files
- [ ] Historical logs
- [ ] Backup data
- [ ] Redis cache snapshots
- [ ] Historical cache performance data 