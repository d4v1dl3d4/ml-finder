#!/bin/bash

# Load environment variables from .env file
if [ -f .env ]; then
    export $(cat .env | grep -v '^#' | xargs)
fi

# Run the MCP remote server with the loaded token
exec npx -y mcp-remote https://mcp.mercadolibre.com/mcp --header "Authorization:Bearer $ML_ACCESS_TOKEN"
