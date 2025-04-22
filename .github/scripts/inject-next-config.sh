#!/bin/bash

# Exit immediately if a command exits with a non-zero status.
set -e

# Check if environment variables are set
if [ -z "$AUTH_SERVER" ] || [ -z "$CLIENT_ID" ]; then
  echo "❌ Error: AUTH_SERVER or CLIENT_ID environment variables not set for injection."
  exit 1
fi

# List of Next.js config files requiring injection
CONFIG_FILES=(
  "packages/civic-auth/nextjs/next.config.ts"
  "packages/civic-auth-web3/solana/next14-no-wallet-adapter/next.config.mjs"
  "packages/civic-auth-web3/solana/next14-wallet-adapter/next.config.mjs"
  "packages/civic-auth-web3/solana/next15-turbopack-no-wallet-adapter/next.config.ts"
  "packages/civic-auth-web3/solana/next15-turbopack-wallet-adapter/next.config.ts"
)

NODE_SCRIPT=".github/scripts/inject-config.js"

echo "🔧 Starting injection process using $NODE_SCRIPT for ${#CONFIG_FILES[@]} config files..."

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
    # Optionally show file content here for debugging
    # cat "$CONFIG_FILE"
    exit 1
  elif [ $NODE_EXIT_CODE -ne 0 ]; then # Catch any other non-zero exit code
    echo "❌ Error: Node script failed for $CONFIG_FILE with exit code $NODE_EXIT_CODE."
    exit 1
  fi

  # Optional: Simple verification with grep after Node script runs
  # echo "   Verifying injection (shell)..."
  # if grep -q 'clientId:.*process\\.env\\.CLIENT_ID.*,' "$CONFIG_FILE" && \
  #    grep -q 'oauthServer:.*"'"$AUTH_SERVER"'".*' "$CONFIG_FILE" && \
  #    grep -q 'callbackUrl:.*http://localhost:.*api/auth/callback`' "$CONFIG_FILE"; then
  #   echo "✅ Shell verification passed for $CONFIG_FILE."
  # else
  #   echo "❌ Error: Shell verification failed after Node script ran for $CONFIG_FILE."
  #   echo "--- Content of $CONFIG_FILE after Node script injection: ---"
  #   cat "$CONFIG_FILE"
  #   echo "---------------------------------------------------------"
  #   exit 1
  # fi
done

echo "---"
echo "✅ Completed injection for all config files." 