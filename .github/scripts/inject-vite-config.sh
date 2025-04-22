#!/bin/bash

# Exit immediately if a command exits with a non-zero status.
set -e

# Check if file argument is provided
if [ -z "$1" ]; then
  echo "Usage: $0 <file_path>"
  exit 1
fi
TARGET_FILE="$1"

echo "🔍 Fixing constants and block in $TARGET_FILE using sed + split/cat..."

# --- Ensure correct const definitions --- 

if [ ! -f "$TARGET_FILE" ]; then
  echo "   ⚠️ Error: Target file not found - $TARGET_FILE"
  exit 1
fi

echo "   Ensuring const definitions..."
SED_TMP=$(mktemp)
# Setup trap for all temp files used later as well
trap 'rm -f "$SED_TMP" "$PART1_TMP" "$PART2_TMP" "$FINAL_TMP"' EXIT

# Delete existing const lines and insert new ones after the import
# Use standard grep -q check before deleting to avoid error if const not present
if grep -q '^const CLIENT_ID = ' "$TARGET_FILE"; then
  sed -e '/^const CLIENT_ID = /d' "$TARGET_FILE" > "$SED_TMP" && mv "$SED_TMP" "$TARGET_FILE"
fi
if grep -q '^const AUTH_SERVER = ' "$TARGET_FILE"; then
  sed -e '/^const AUTH_SERVER = /d' "$TARGET_FILE" > "$SED_TMP" && mv "$SED_TMP" "$TARGET_FILE"
fi
if grep -q '^const WALLET_API_BASE_URL = ' "$TARGET_FILE"; then
  sed -e '/^const WALLET_API_BASE_URL = /d' "$TARGET_FILE" > "$SED_TMP" && mv "$SED_TMP" "$TARGET_FILE"
fi

# Append the correct constants after the import line
# Assume an import line with @civic/auth-web3 exists
sed -i.bak -e '/import.*@civic\/auth-web3/a \
const CLIENT_ID = import.meta.env.VITE_CLIENT_ID;\
const AUTH_SERVER = import.meta.env.VITE_AUTH_SERVER;\
const WALLET_API_BASE_URL = import.meta.env.VITE_WALLET_API_BASE_URL;' "$TARGET_FILE"

if [ $? -ne 0 ]; then
    echo "   ❌ Error fixing const definitions in $TARGET_FILE"
    [ -f "${TARGET_FILE}.bak" ] && mv "${TARGET_FILE}.bak" "$TARGET_FILE"
    exit 1
fi
rm -f "${TARGET_FILE}.bak" # Clean up backup
# SED_TMP will be cleaned by trap

# --- Handle block replacement using split/cat --- 

echo "   Processing block replacement for target file: $TARGET_FILE..."

# Find the starting line number (AFTER const fix)
START_LINE=$(grep -n '<CivicAuthProvider' "$TARGET_FILE" | head -n 1 | cut -d: -f1)

if [ -z "$START_LINE" ]; then
  echo "   ❌ Error: Could not find start pattern '<CivicAuthProvider' in $TARGET_FILE after fixing constants."
  exit 1 
fi

echo "   Found start pattern on line: $START_LINE"

# Define the end line of the block to be replaced (start + 2 lines = 3 total lines)
BLOCK_END_LINE=$((START_LINE + 2))
# Define the start line of the content after the block
SUFFIX_START_LINE=$((BLOCK_END_LINE + 1))

# Create temporary files (relying on trap for cleanup)
PART1_TMP=$(mktemp)
PART2_TMP=$(mktemp)
FINAL_TMP=$(mktemp)

# Extract part 1 (before the block)
PREFIX_END_LINE=$((START_LINE - 1))
if [ "$PREFIX_END_LINE" -gt 0 ]; then
  echo "   Extracting lines 1-$PREFIX_END_LINE..."
  head -n "$PREFIX_END_LINE" "$TARGET_FILE" > "$PART1_TMP" || { echo "❌ Error running head"; exit 1; }
else
  echo "   No prefix lines to extract."
  > "$PART1_TMP"
fi

# Extract part 2 (after the block)
echo "   Extracting lines $SUFFIX_START_LINE onwards..."
tail -n +"$SUFFIX_START_LINE" "$TARGET_FILE" > "$PART2_TMP" || { echo "❌ Error running tail"; exit 1; }

# --- Reconstruct --- 
echo "   Reconstructing file..."
cat "$PART1_TMP" > "$FINAL_TMP" || { echo "❌ Error cat part1"; exit 1; }

# Append the Replacement Block using a Here Document (Includes endpoints)
cat << EOF >> "$FINAL_TMP" || { echo "❌ Error cat here-doc"; exit 1; }
    <CivicAuthProvider 
      clientId={CLIENT_ID} 
      config={{ oauthServer: AUTH_SERVER }}
      endpoints={{ wallet: WALLET_API_BASE_URL }}
    >
EOF

# Append Part 2
cat "$PART2_TMP" >> "$FINAL_TMP" || { echo "❌ Error cat part2"; exit 1; }

# --- Final Check and Replace ---
echo "   Replacing original file..."
if [ -s "$FINAL_TMP" ]; then # Check if final file is not empty
    mv "$FINAL_TMP" "$TARGET_FILE" || { echo "❌ Error moving final file"; exit 1; }
    echo "   ✅ Specific file processing complete for $TARGET_FILE"
else
    echo "   ❌ Error: Final reconstructed file is empty."
    exit 1
fi
# Trap will clean up remaining temp files

echo "✅ Vite config const and block replacement complete for $TARGET_FILE." 