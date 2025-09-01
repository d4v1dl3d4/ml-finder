#!/bin/bash

echo "=== MercadoLibre API Test Commands ==="
echo ""
echo "Copy and paste these commands to test the APIs:"
echo ""

echo "# Category Predictor API:"
export ML_ACCESS_TOKEN=$(grep ML_ACCESS_TOKEN .env | cut -d="=" -f2) && curl -s -H "Authorization: Bearer $ML_ACCESS_TOKEN" "https://api.mercadolibre.com/sites/MLA/domain_discovery/search?q=iPhone" | jq .


# Items API
# {
#   "code": "unauthorized",
#   "message": "authorization value not present"
# }
export ML_ACCESS_TOKEN=$(grep ML_ACCESS_TOKEN .env | cut -d="=" -f2) && curl -s -H "Authorization: Bearer $ML_ACCESS_TOKEN" "https://api.mercadolibre.com/sites/MLA/search?q=iPhone" | jq .

