#!/bin/bash

# Load environment variables from .env if it exists
if [ -f .env ]; then
    export $(grep -v '^#' .env | xargs)
fi

# Get title from command line argument or use default (must be in English)
TITLE=${1:-"iPhone 13 Pro 128GB"}

echo "Predicting category for '$TITLE' using Category Predictor API..."
echo "Note: Title must be in English for the API to work properly"

# Check if access token is available
if [ -z "$ML_ACCESS_TOKEN" ]; then
    echo "Error: ML_ACCESS_TOKEN not found in environment"
    echo "Please set ML_ACCESS_TOKEN in your .env file"
    exit 1
fi

# Try site-specific Category Predictor API first
SITE_ID="MLA"
RESPONSE=$(curl -s -X GET \
  -H "Authorization: Bearer $ML_ACCESS_TOKEN" \
  "https://api.mercadolibre.com/sites/$SITE_ID/domain_discovery/search?q=$(echo "$TITLE" | sed 's/ /%20/g')")

# If that fails, try the global endpoint
if echo "$RESPONSE" | grep -q "error\|message"; then
    echo "Site-specific endpoint failed, trying global endpoint..."
    RESPONSE=$(curl -s -X GET \
      -H "Authorization: Bearer $ML_ACCESS_TOKEN" \
      "https://api.mercadolibre.com/marketplace/domain_discovery/search?q=$(echo "$TITLE" | sed 's/ /%20/g')")
fi

# Check if curl was successful
if [ $? -ne 0 ]; then
    echo "Error: Failed to make API request"
    exit 1
fi

# Parse and display category predictions using jq
echo "=== Category Predictions ==="
echo "$RESPONSE" | jq -r '
if type == "array" then
  if length > 0 then
    .[0] | "Domain: \(.domain_name // "N/A") (ID: \(.domain_id // "N/A"))\nCategory: \(.category_name // "N/A") (ID: \(.category_id // "N/A"))\nAttributes: \(.attributes // [] | length) predicted attributes\n"
  else
    "No predictions found"
  end
elif .domain_id then
  "Domain: \(.domain_name) (ID: \(.domain_id))\nCategory: \(.category_name) (ID: \(.category_id))\nAttributes: \(.attributes | length) predicted attributes\n"
elif .message then
  "Error: \(.message)"
elif .error then
  "Error: \(.error)"
else
  "Error: Invalid response format"
end'