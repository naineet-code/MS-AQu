#!/bin/bash
LINE_NUM=603
FILE_PATH="./merchandising-module-site/src/components/FAQPage.tsx"
sed -i "${LINE_NUM}s/{(msg.message || '').length > 100 &&/{getFormattedMessage(msg).length > 100 &&/" "$FILE_PATH"
