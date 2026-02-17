#!/bin/bash
# Setup cron job for daily image generation

SCRIPT_DIR="/var/www/dashboard/apps/showthenews"
LOG_FILE="$SCRIPT_DIR/daily-generation.log"

# Create cron job for midnight UTC
(crontab -l 2>/dev/null | grep -v "generate-daily-image.js"; echo "0 0 * * * cd $SCRIPT_DIR && /usr/bin/node generate-daily-image.js >> $LOG_FILE 2>&1") | crontab -

echo "✓ Cron job configured:"
echo "  - Runs daily at midnight UTC"
echo "  - Script: $SCRIPT_DIR/generate-daily-image.js"
echo "  - Logs: $LOG_FILE"
echo ""
echo "Current crontab:"
crontab -l | grep "generate-daily-image"
