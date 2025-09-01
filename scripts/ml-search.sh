




#!/bin/bash

# Load environment variables from .env if it exists
if [ -f .env ]; then
    export $(grep -v '^#' .env | xargs)
fi

# Get search query from command line argument or use default
QUERY=${1:-"iphone"}
SITE_ID=${2:-"MLA"}

echo "Searching for '$QUERY' in site $SITE_ID using Items API..."

# Use Items API to get actual marketplace listings with prices
# Authorization is now required
if [ -z "$ML_ACCESS_TOKEN" ]; then
    echo "Error: ML_ACCESS_TOKEN not found in environment"
    echo "Please set ML_ACCESS_TOKEN in your .env file"
    exit 1
fi

RESPONSE=$(curl -s -X GET \
  -H "Authorization: Bearer $ML_ACCESS_TOKEN" \
  "https://api.mercadolibre.com/sites/$SITE_ID/search?q=$QUERY&limit=5")

# Check if curl was successful
if [ $? -ne 0 ]; then
    echo "Error: Failed to make API request"
    exit 1
fi

# Parse and display only product name and price using jq
echo "=== Search Results ==="
echo "$RESPONSE" | jq -r '
if .results then
  .results[] | 
  "Product: \(.title)\nPrice: \(.currency_id) \(.price)\n"
elif .message then
  "Error: \(.message)"
elif .error then
  "Error: \(.error)"
else
  "Error: Invalid response format"
end'