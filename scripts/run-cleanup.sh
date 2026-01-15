#!/bin/bash

# Stripe Customer Cleanup Script
# This script removes orphaned customer records (no payments/subscriptions)

# Configuration
API_URL="${CLEANUP_URL:-https://myrecruiter.ai/api/cleanup-orphan-customers}"
API_KEY="${CLEANUP_API_KEY}"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if API key is set
if [ -z "$CLEANUP_API_KEY" ]; then
    echo -e "${RED}Error: CLEANUP_API_KEY environment variable not set${NC}"
    echo "Usage: CLEANUP_API_KEY=your_key ./run-cleanup.sh [--execute]"
    exit 1
fi

# Check for --execute flag (default is dry-run)
DRY_RUN="true"
if [ "$1" == "--execute" ]; then
    DRY_RUN="false"
    echo -e "${YELLOW}⚠️  EXECUTE MODE - This will permanently delete orphaned customers!${NC}"
    read -p "Are you sure? (yes/no): " confirm
    if [ "$confirm" != "yes" ]; then
        echo "Aborted."
        exit 0
    fi
else
    echo -e "${GREEN}🔍 DRY RUN MODE - No customers will be deleted${NC}"
    echo "   Add --execute flag to actually delete orphaned customers"
fi

echo ""
echo "Calling cleanup API..."
echo ""

# Make the API call
response=$(curl -s -X POST "$API_URL" \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $API_KEY" \
    -d "{\"dryRun\": $DRY_RUN}")

# Pretty print the response
echo "$response" | python3 -m json.tool 2>/dev/null || echo "$response"

echo ""
echo "Done."
