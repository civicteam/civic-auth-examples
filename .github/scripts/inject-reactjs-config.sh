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

# Delete ALL existing const lines first in one pass
echo "   Deleting existing const declarations..."
sed -e '/^const CLIENT_ID = /d' \
    -e '/^const AUTH_SERVER = /d' "$TARGET_FILE" > "$SED_TMP"

if [ $? -ne 0 ]; then
    echo "   ❌ Error deleting existing const definitions from $TARGET_FILE"
    exit 1
fi

# Now find the last import line and append the constants after it
echo "   Appending new const declarations after imports..."
LAST_IMPORT_LINE=$(grep -n "^import" "$SED_TMP" | tail -n 1 | cut -d: -f1)

if [ -z "$LAST_IMPORT_LINE" ]; then
    # No import found, add at the beginning
    LAST_IMPORT_LINE=0
fi

# Create a temporary file with the first part (before and including the last import)
head -n "$LAST_IMPORT_LINE" "$SED_TMP" > "$SED_TMP.head"

# Create a temporary file with the rest of the file (after the last import)
tail -n +$((LAST_IMPORT_LINE + 1)) "$SED_TMP" > "$SED_TMP.tail"

# Create the combined file with constants in between
cat "$SED_TMP.head" > "$SED_TMP.new"
echo "" >> "$SED_TMP.new"
echo "const CLIENT_ID = import.meta.env.VITE_CLIENT_ID;" >> "$SED_TMP.new"
echo "const AUTH_SERVER = import.meta.env.VITE_AUTH_SERVER;" >> "$SED_TMP.new"
echo "" >> "$SED_TMP.new"
cat "$SED_TMP.tail" >> "$SED_TMP.new"

# Replace original file with the fully corrected temp file
mv "$SED_TMP.new" "$TARGET_FILE" || { echo "❌ Error replacing original file with corrected constants"; exit 1; }

# Clean up temporary files
rm -f "$SED_TMP.head" "$SED_TMP.tail" "$SED_TMP"

# --- Handle block replacement using split/cat --- 

echo "   Processing block replacement for target file: $TARGET_FILE..."

# Find the starting line number (AFTER const fix)
START_LINE=$(grep -n '<CivicAuthProvider' "$TARGET_FILE" | head -n 1 | cut -d: -f1)

if [ -z "$START_LINE" ]; then
  echo "   ❌ Error: Could not find start pattern '<CivicAuthProvider' in $TARGET_FILE after fixing constants."
  exit 1 
fi

echo "   Found start pattern on line: $START_LINE"

# Find the closing bracket of CivicAuthProvider
END_LINE=$(tail -n +"$START_LINE" "$TARGET_FILE" | grep -n ">$" | head -n 1 | cut -d: -f1)
if [ -z "$END_LINE" ]; then
  # Try with a different pattern for the closing bracket
  END_LINE=$(tail -n +"$START_LINE" "$TARGET_FILE" | grep -n ">" | head -n 1 | cut -d: -f1)
  if [ -z "$END_LINE" ]; then
    echo "   ❌ Error: Could not find end pattern '>' for CivicAuthProvider."
    exit 1
  fi
fi

# Calculate the actual line number in the file
END_LINE=$((START_LINE + END_LINE - 1))
# Define the start line of the content after the block
SUFFIX_START_LINE=$((END_LINE + 1))

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

echo "✅ Reactjs const and block replacement complete for $TARGET_FILE." 