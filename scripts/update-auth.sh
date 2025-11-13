#!/usr/bin/env bash
set -euo pipefail

# Update either @civic/auth-web3 or @civic/auth across the repo or a specific project.
#
# Usage:
#   scripts/update-auth.sh <web3|auth> [version=latest] [path]
#
# Examples:
#   scripts/update-auth.sh web3                   # update all projects using @civic/auth-web3 to latest
#   scripts/update-auth.sh auth                   # update all projects using @civic/auth to latest
#   scripts/update-auth.sh web3 0.7.2            # update all @civic/auth-web3 to version 0.7.2
#   scripts/update-auth.sh auth 0.9.5            # update all @civic/auth to version 0.9.5
#   scripts/update-auth.sh auth latest packages/civic-auth/nextjs   # only update that project

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

if [[ $# -lt 1 ]]; then
  echo "Usage: scripts/update-auth.sh <web3|auth> [version=latest] [path]" >&2
  exit 1
fi

TARGET_KIND="$1"     # web3 | auth
VERSION="${2:-latest}"
TARGET_PATH="${3:-}"

case "$TARGET_KIND" in
  web3) PKG_NAME="@civic/auth-web3" ;;
  auth) PKG_NAME="@civic/auth" ;;
  *) echo "First arg must be 'web3' or 'auth'" >&2; exit 1;;
esac

# Build list of project directories containing the target package
scan_base="$ROOT_DIR"
if [[ -n "$TARGET_PATH" ]]; then
  if [[ -f "$TARGET_PATH" ]]; then
    scan_base="$(dirname "$TARGET_PATH")"
  else
    scan_base="$TARGET_PATH"
  fi
fi

PROJECT_DIRS=()
while IFS= read -r line; do
  PROJECT_DIRS+=("$line")
done < <(
  find "$scan_base" -type f -name package.json -not -path '*/node_modules/*' \
    -exec grep -l "\"$PKG_NAME\"" {} + \
  | xargs -n1 dirname \
  | sort -u
)

if [[ ${#PROJECT_DIRS[@]} -eq 0 ]]; then
  echo "No projects found with $PKG_NAME under: $scan_base"
  exit 0
fi

echo "Found ${#PROJECT_DIRS[@]} projects to update for $PKG_NAME ($VERSION)."

for dir in "${PROJECT_DIRS[@]}"; do
  printf "\n==> Updating %s\n" "$dir"
  pushd "$dir" >/dev/null
  # Capture current spec (so we can preserve "*" if that's the chosen policy)
  CURRENT_SPEC=$(node -e "const p=require('./package.json'); const k='${PKG_NAME}'; const s=(p.dependencies&&p.dependencies[k])||(p.devDependencies&&p.devDependencies[k])||''; process.stdout.write(s);")

  # Ensure lockfile is up to date before upgrading
  echo "yarn install"
  yarn install

  if [[ "$VERSION" == "latest" ]]; then
    echo "yarn upgrade $PKG_NAME"
    yarn upgrade "$PKG_NAME"
  else
    echo "yarn add $PKG_NAME@$VERSION"
    yarn add "$PKG_NAME@$VERSION"
    # If the project previously used '*' keep it that way in package.json while retaining the new lockfile resolution
    if [[ "$CURRENT_SPEC" == "*" ]]; then
      ESCAPED_NAME=${PKG_NAME//\//\\/}
      perl -0777 -i -pe "s/(\"${ESCAPED_NAME}\"\s*:\s*)\"[^\"]+\"/
\${1}\"*\"/g" package.json
      echo "Restored ${PKG_NAME} spec to '*' in package.json"
    fi
  fi
  popd >/dev/null
done

echo "\nAll done."


