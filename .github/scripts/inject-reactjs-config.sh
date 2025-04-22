#!/bin/bash

# Exit immediately if a command exits with a non-zero status.
set -e

# Check if file argument is provided
if [ -z "$1" ]; then
  echo "Usage: $0 <file_path>"
  exit 1
fi
TARGET_FILE="$1"

echo "🔍 Performing reactjs block replacement in $TARGET_FILE using split/cat..."

# --- Handle specific file with block replacement --- 

if [ ! -f "$TARGET_FILE" ]; then
  echo "   ⚠️ Error: Target file not found - $TARGET_FILE"
  exit 1
fi

echo "   Processing target file: $TARGET_FILE..."

# Find the starting line number
START_LINE=$(grep -n '<CivicAuthProvider' "$TARGET_FILE" | head -n 1 | cut -d: -f1)

if [ -z "$START_LINE" ]; then
  echo "   ❌ Error: Could not find start pattern '<CivicAuthProvider' in $TARGET_FILE"
  exit 1 
fi

echo "   Found start pattern on line: $START_LINE"

# Define the end line of the block to be replaced (start + 2 lines = 3 total lines)
BLOCK_END_LINE=$((START_LINE + 2))
# Define the start line of the content after the block
SUFFIX_START_LINE=$((BLOCK_END_LINE + 1))

# Create temporary files
PART1_TMP=$(mktemp)
PART2_TMP=$(mktemp)
FINAL_TMP=$(mktemp)

# Ensure cleanup on exit
trap 'rm -f "$PART1_TMP" "$PART2_TMP" "$FINAL_TMP"' EXIT

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

# Append the Replacement Block using a Here Document (NO endpoints line)
cat << EOF >> "$FINAL_TMP" || { echo "❌ Error cat here-doc"; exit 1; }
    <CivicAuthProvider 
      clientId={CLIENT_ID} 
      config={{ oauthServer: AUTH_SERVER }}
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

echo "✅ Reactjs block replacement complete for $TARGET_FILE." 