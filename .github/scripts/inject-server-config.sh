#!/bin/bash

# Exit immediately if a command exits with a non-zero status.
set -e

# Check if environment variables are set
if [ -z "$AUTH_SERVER" ] || [ -z "$CLIENT_ID" ]; then
  echo "❌ Error: AUTH_SERVER or CLIENT_ID environment variables not set for injection."
  exit 1
fi

# List of server config files requiring injection
CONFIG_FILES=(
  "packages/civic-auth/server/hono/src/index.ts"
  "packages/civic-auth/server/fastify/src/app.ts"
  "packages/civic-auth/server/express/src/app.ts"
)

NODE_SCRIPT=".github/scripts/inject-config.js"

echo "🔧 Starting injection process using $NODE_SCRIPT for ${#CONFIG_FILES[@]} server config files..."

for CONFIG_FILE in "${CONFIG_FILES[@]}"; do
  echo "---"
  echo "Processing: $CONFIG_FILE"
  
  if [ ! -f "$CONFIG_FILE" ]; then
    echo "❌ Error: Config file $CONFIG_FILE not found."
    exit 1
  fi

  echo "   Injecting config via Node.js script..."
  # Call the Node.js script to perform the injection
  node "$NODE_SCRIPT" "$CONFIG_FILE" "$CLIENT_ID" "$AUTH_SERVER"
  NODE_EXIT_CODE=$?

  # Check Node script exit code
  if [ $NODE_EXIT_CODE -eq 1 ]; then
    echo "❌ Error: Node script failed for $CONFIG_FILE (General error)."
    exit 1
  elif [ $NODE_EXIT_CODE -eq 2 ]; then
    echo "❌ Error: Node script reported pattern not found in $CONFIG_FILE."
    exit 1
  elif [ $NODE_EXIT_CODE -ne 0 ]; then # Catch any other non-zero exit code
    echo "❌ Error: Node script failed for $CONFIG_FILE with exit code $NODE_EXIT_CODE."
    exit 1
  fi
done

echo "---"
echo "✅ Completed injection for all server config files." 