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
  "packages/civic-auth-web3/solana/next15-turbopack-no-wallet-adapter/next.config.mjs"
  "packages/civic-auth-web3/solana/next15-turbopack-wallet-adapter/next.config.mjs"
)

echo "🔧 Starting injection process for ${#CONFIG_FILES[@]} config files..."

for CONFIG_FILE in "${CONFIG_FILES[@]}"; do
  echo "---"
  echo "Processing: $CONFIG_FILE"
  
  if [ ! -f "$CONFIG_FILE" ]; then
    echo "❌ Error: Config file $CONFIG_FILE not found."
    exit 1
  fi

  echo "   Injecting oauthServer and callbackUrl..."
  # Use sed to insert oauthServer and callbackUrl lines after the clientId line within createCivicAuthPlugin or env object
  # Match variations in quotes and spacing around process.env.CLIENT_ID
  # Note the backslash \ at the end of the line containing 'a \' is crucial for sed multi-line append
  # Ensure the indentation of the inserted lines is correct (4 spaces for createCivicAuthPlugin)
  # callbackUrl is hardcoded as a JS template literal using the PORT variable from the config file scope
  sed -i.bak "/clientId:.*process\.env\.CLIENT_ID.*/a \
    oauthServer: \"$AUTH_SERVER\",\
    callbackUrl: \`http://localhost:\${PORT}/api/auth/callback\`
" "$CONFIG_FILE"

  echo "   Verifying injection..."
  # Verify the change, looking for the clientId pattern, the oauthServer line, and the hardcoded callbackUrl template literal
  # Adjust grep pattern for verification
  if grep -q 'clientId:.*process\.env\.CLIENT_ID.*' "$CONFIG_FILE" && \
     grep -q 'oauthServer:.*'$AUTH_SERVER'.*' "$CONFIG_FILE" && \
     grep -q 'callbackUrl: \`http://localhost:\${PORT}/api/auth/callback\`' "$CONFIG_FILE"; then
    echo "✅ Successfully injected and verified configuration into $CONFIG_FILE."
    rm "${CONFIG_FILE}.bak"
  else
    echo "❌ Error: Failed to inject or verify configuration into $CONFIG_FILE."
    echo "--- Content of $CONFIG_FILE after attempted injection: ---"
    cat "$CONFIG_FILE"
    echo "---------------------------------------------------------"
    # Optional: Restore backup if needed
    # if [ -f "${CONFIG_FILE}.bak" ]; then mv "${CONFIG_FILE}.bak" "$CONFIG_FILE"; fi
    exit 1
  fi
done

echo "---"
echo "✅ Completed injection for all config files." 