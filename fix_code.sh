#!/bin/bash
FILE="./merchandising-module-site/src/components/FAQPage.tsx"

# Create a backup
cp "$FILE" "${FILE}.bak"

# Use perl for the replacement
perl -i -pe 's/\{(msg\.message \|\| \'\'|\'\')\.length > 100/\{getFormattedMessage(msg)\.length > 100/g' "$FILE"

echo "File updated. Backup saved as ${FILE}.bak"
