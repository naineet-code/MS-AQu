# Deployment Checklist

## Pre-deployment Checks

### Environment Setup
- [ ] Create and activate virtual environment
- [ ] Install all dependencies from requirements.txt
- [ ] Copy and configure .env file
- [ ] Verify all environment variables are set

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

## Deployment Steps

### Backend Deployment
1. [ ] Stop existing services
2. [ ] Backup current deployment
3. [ ] Deploy new code
4. [ ] Run database migrations (if any)
5. [ ] Start new services
6. [ ] Verify service health

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

### Logging Verification
- [ ] Check log file creation
- [ ] Verify log rotation
- [ ] Test error logging
- [ ] Monitor application logs

## Rollback Plan

### If Issues Occur
1. [ ] Stop new services
2. [ ] Restore previous deployment
3. [ ] Start previous services
4. [ ] Verify system stability

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