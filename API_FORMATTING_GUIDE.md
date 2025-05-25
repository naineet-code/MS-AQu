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