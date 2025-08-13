#!/usr/bin/env bash
set -euo pipefail

# Update @civic/auth-web3 and @civic/auth across all subprojects that depend on them.
#
# Usage:
#   scripts/update-auth.sh [--web3 <version>|latest] [--auth <version>|latest] [--range exact|caret|tilde] [--dry-run]
#
# Examples:
#   scripts/update-auth.sh                           # Update both to latest, caret by default (yarn classic default)
#   scripts/update-auth.sh --range exact             # Pin to exact resolved latest versions (-E)
#   scripts/update-auth.sh --web3 0.7.2 --auth 0.9.5 # Update to specific versions
#   scripts/update-auth.sh --range tilde --web3 0.7.2 --auth 0.9.5
#   scripts/update-auth.sh --dry-run                 # Show what would run without changing anything

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

WEB3_VERSION="latest"
AUTH_VERSION="latest"
RANGE_MODE="caret"   # one of: exact | caret | tilde
DRY_RUN=0

print_help() {
  grep '^#' "$0" | sed 's/^# \{0,1\}//'
}

while [[ $# -gt 0 ]]; do
  case "$1" in
    --web3)
      WEB3_VERSION="${2:-}"
      shift 2
      ;;
    --auth)
      AUTH_VERSION="${2:-}"
      shift 2
      ;;
    --range)
      RANGE_MODE="${2:-}"
      case "$RANGE_MODE" in
        exact|caret|tilde) ;;
        *) echo "--range must be one of: exact, caret, tilde" >&2; exit 1;;
      esac
      shift 2
      ;;
    --dry-run)
      DRY_RUN=1
      shift 1
      ;;
    -h|--help)
      print_help; exit 0
      ;;
    *)
      echo "Unknown argument: $1" >&2
      print_help
      exit 1
      ;;
  esac
done

# Compose spec with optional range prefix when a concrete version is provided.
format_spec() {
  local pkg="$1"
  local version="$2"
  local range_mode="$3"
  if [[ "$version" == "latest" ]]; then
    # Let yarn resolve to latest. Range handling:
    # - exact => we'll pass -E to pin
    # - caret/tilde => yarn classic defaults to caret for "@latest" without -E
    echo "${pkg}@latest"
    return 0
  fi
  case "$range_mode" in
    exact) echo "${pkg}@${version}" ;;
    caret) echo "${pkg}@^${version}" ;;
    tilde) echo "${pkg}@~${version}" ;;
  esac
}

# Use -E only when exact pinning is requested
ADD_FLAG=""
if [[ "$RANGE_MODE" == "exact" ]]; then
  ADD_FLAG="-E"
fi

PROJECT_DIRS=()
while IFS= read -r line; do
  PROJECT_DIRS+=("$line")
done < <(
  find "$ROOT_DIR" -type f -name package.json -not -path '*/node_modules/*' \
    -exec grep -lE '"@civic/(auth-web3|auth)"' {} + \
  | xargs -n1 dirname \
  | sort -u
)

if [[ ${#PROJECT_DIRS[@]} -eq 0 ]]; then
  echo "No projects found that depend on @civic/auth-web3 or @civic/auth."
  exit 0
fi

echo "Found ${#PROJECT_DIRS[@]} projects to update."

for dir in "${PROJECT_DIRS[@]}"; do
  printf "\n==> Updating %s\n" "$dir"
  if [[ ! -f "$dir/package.json" ]]; then
    echo "Skipping (no package.json): $dir"
    continue
  fi

  pushd "$dir" >/dev/null

  # Determine which packages are present in this project
  HAS_WEB3=0
  HAS_AUTH=0
  grep -q '"@civic/auth-web3"' package.json && HAS_WEB3=1 || true
  grep -q '"@civic/auth"' package.json && HAS_AUTH=1 || true

  # Build the add list
  ADD_PKGS=()
  if [[ $HAS_WEB3 -eq 1 ]]; then
    ADD_PKGS+=("$(format_spec "@civic/auth-web3" "$WEB3_VERSION" "$RANGE_MODE")")
  fi
  if [[ $HAS_AUTH -eq 1 ]]; then
    ADD_PKGS+=("$(format_spec "@civic/auth" "$AUTH_VERSION" "$RANGE_MODE")")
  fi

  if [[ ${#ADD_PKGS[@]} -eq 0 ]]; then
    echo "Nothing to update here."
    popd >/dev/null
    continue
  fi

  echo "yarn add ${ADD_PKGS[*]} ${ADD_FLAG}"
  if [[ $DRY_RUN -eq 0 ]]; then
    # Ensure we use yarn classic behavior consistently (Corepack can inject packageManager automatically)
    yarn add ${ADD_PKGS[*]} ${ADD_FLAG}
  fi

  popd >/dev/null
done

echo "\nAll done."


