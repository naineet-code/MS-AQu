# Rich Text Test Examples

## Sample API Responses for Testing

### Basic Formatting Test
```json
{
  "answer": "This is a **bold statement** with *italic emphasis* and `inline code`. Here's how you can format responses:\n\n## Main Points\n\n1. **First point**: Use bold for important terms\n2. *Second point*: Use italics for emphasis\n3. `Third point`: Use code formatting for technical terms\n\n### Code Example\n```javascript\nconst result = calculateInventory(currentStock, salesRate);\nconsole.log('Coverage days:', result);\n```\n\n> This is a blockquote for highlighting important information or quotes from documents.",
  "reasoning": "### Analysis Process\n\nThe system follows these steps:\n\n1. **Data Collection**\n   - Gather historical sales data\n   - Analyze current inventory levels\n   - Review market trends\n\n2. **Processing**\n   - Apply statistical models\n   - Calculate projections\n   - Generate recommendations\n\n3. **Output Generation**\n   - Format results\n   - Create visualizations\n   - Prepare reports"
}
```

### Table Formatting Test
```json
{
  "answer": "# Inventory Analysis Results\n\n| Product Category | Current Stock | Daily Sales | Coverage Days |\n|-----------------|---------------|-------------|---------------|\n| Clothing        | 1,250 units   | 45 units    | 28 days       |\n| Electronics     | 850 units     | 32 units    | 27 days       |\n| Home & Garden   | 2,100 units   | 78 units    | 27 days       |\n\n## Key Insights\n\n- **Optimal Coverage**: 25-30 days\n- **Risk Level**: Low to Medium\n- **Action Required**: Monitor Electronics category\n\n### Recommendations\n\n> **Important**: Consider reordering Electronics within the next week to maintain optimal coverage levels."
}
```

### Complex Formatting Test
```json
{
  "answer": "# WSSI Module Overview\n\n## What is WSSI?\n\nThe **Weekly Sales and Stock Intelligence (WSSI)** module is a comprehensive tool for:\n\n- *Inventory optimization*\n- Sales forecasting\n- Stock level management\n\n### Key Features\n\n#### 1. Predictive Analytics\n```python\n# Example calculation\ncoverage_days = current_stock / average_daily_sales\nif coverage_days < 14:\n    status = \"**LOW STOCK ALERT**\"\nelse:\n    status = \"*Optimal Level*\"\n```\n\n#### 2. Real-time Monitoring\n\n> The system continuously monitors stock levels and provides real-time alerts when intervention is needed.\n\n#### 3. Automated Reporting\n\n- **Daily Reports**: Stock status updates\n- **Weekly Reports**: Trend analysis\n- **Monthly Reports**: Performance summaries\n\n---\n\n### Implementation Guidelines\n\n1. **Setup Phase**\n   - Configure data sources\n   - Set alert thresholds\n   - Define reporting schedules\n\n2. **Monitoring Phase**\n   - Review daily alerts\n   - Analyze trend reports\n   - Adjust parameters as needed\n\n3. **Optimization Phase**\n   - Fine-tune algorithms\n   - Update forecasting models\n   - Implement improvements\n\n**Note**: All calculations are based on *rolling averages* to account for seasonal variations.",
  "relevant_paragraphs": [
    {
      "id": "para_1",
      "text": "The WSSI system uses **machine learning algorithms** to predict future sales patterns based on:\n\n- Historical sales data\n- *Seasonal trends*\n- Market conditions\n- `inventory_turnover_rate`\n\nThis enables more accurate forecasting and better inventory management decisions.",
      "pages": "Page 15-17"
    }
  ]
}
```

### List and Formatting Combinations
```json
{
  "answer": "# Size Curve Analysis\n\n## Overview\n\nSize curve analysis helps retailers understand:\n\n### Primary Factors\n\n1. **Customer Demographics**\n   - Age distribution\n   - Geographic location\n   - Shopping preferences\n\n2. **Product Characteristics**\n   - *Brand positioning*\n   - Price points\n   - Style categories\n\n3. **Channel Differences**\n   - `online_sales_pattern`\n   - `retail_store_pattern`\n   - `marketplace_pattern`\n\n### Mathematical Model\n\n```\nSize Ratio = (Size Sales / Total Sales) × 100\nConfidence Interval = ±2σ where σ = standard deviation\n```\n\n> **Important**: Size curves should be analyzed separately for different product categories and sales channels.\n\n### Implementation Steps\n\n- [ ] Collect historical sales data\n- [ ] Segment by product category\n- [ ] Calculate size ratios\n- [ ] Apply statistical analysis\n- [ ] Generate recommendations\n\n**Result**: Optimized inventory allocation across all size ranges."
}
```

## Frontend Rendering

The frontend will automatically apply theme-appropriate styling:

### Reliance FAQ Site Colors
- **Headers**: Blue tones
- **Code**: Green backgrounds
- **Emphasis**: Yellow (bold), Purple (italic)
- **Links**: Blue with hover effects

### Merchandising Site Colors
- **Headers**: Cyan tones
- **Code**: Emerald backgrounds
- **Emphasis**: Amber (bold), Purple (italic)
- **Links**: Cyan with hover effects

## Testing Instructions

1. Use the backend API to send responses with the above formatting
2. Test in both light and dark themes
3. Verify responsive behavior on mobile devices
4. Check accessibility with screen readers
5. Validate that complex nested formatting renders correctly

## Performance Considerations

- Rich text processing is done client-side
- Minimal impact on page load times
- Markdown parsing is optimized for speed
- Large formatted responses should be tested for performance