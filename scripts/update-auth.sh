#!/usr/bin/env bash
set -euo pipefail

# Update either @civic/auth-web3 or @civic/auth across the repo or a specific project.
#
# Usage:
#   scripts/update-auth.sh [web3|auth] [version=latest] [path]
#
# Examples:
#   scripts/update-auth.sh                        # update both @civic/auth-web3 and @civic/auth to latest (*)
#   scripts/update-auth.sh web3                   # update all projects using @civic/auth-web3 to latest
#   scripts/update-auth.sh auth                   # update all projects using @civic/auth to latest
#   scripts/update-auth.sh web3 0.7.2            # update all @civic/auth-web3 to version 0.7.2
#   scripts/update-auth.sh auth 0.9.5            # update all @civic/auth to version 0.9.5
#   scripts/update-auth.sh auth latest packages/civic-auth/nextjs   # only update that project

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

# Function to get latest version from npm
get_latest_version() {
  local pkg_name="$1"
  npm view "$pkg_name" version 2>/dev/null
}

# Function to get all resolved versions from yarn.lock files
get_lockfile_versions() {
  local pkg_name="$1"
  local lock_files=()
  while IFS= read -r lock_file; do
    lock_files+=("$lock_file")
  done < <(find "$ROOT_DIR" -type f -name yarn.lock -not -path '*/node_modules/*')

  local all_versions=()
  for lock_file in "${lock_files[@]}"; do
    local versions=$(grep -A 2 "^\"$pkg_name@" "$lock_file" | grep "version " | awk '{print $2}' | tr -d '"')
    if [[ -n "$versions" ]]; then
      while IFS= read -r ver; do
        all_versions+=("$ver")
      done <<< "$versions"
    fi
  done

  # Return unique versions
  printf '%s\n' "${all_versions[@]}" | sort -u
}

# Function to check if package needs update
needs_update() {
  local pkg_name="$1"
  local latest_version="$2"

  local current_versions=$(get_lockfile_versions "$pkg_name")

  if [[ -z "$current_versions" ]]; then
    return 1  # No versions found, no update needed
  fi

  # Check if any version is not the latest
  while IFS= read -r ver; do
    if [[ "$ver" != "$latest_version" ]]; then
      return 0  # Update needed
    fi
  done <<< "$current_versions"

  return 1  # All versions are latest
}

# Function to check for stale versions in yarn.lock files
check_stale_versions() {
  local pkg_name="$1"
  echo -e "\n==> Checking for stale versions of $pkg_name in yarn.lock files..."

  local lock_files=()
  while IFS= read -r lock_file; do
    lock_files+=("$lock_file")
  done < <(find "$ROOT_DIR" -type f -name yarn.lock -not -path '*/node_modules/*')

  if [[ ${#lock_files[@]} -eq 0 ]]; then
    echo "No yarn.lock files found"
    return
  fi

  local found_stale=0
  for lock_file in "${lock_files[@]}"; do
    local versions=$(grep -A 2 "^\"$pkg_name@" "$lock_file" | grep "version " | awk '{print $2}' | tr -d '"' | sort -u)
    if [[ -n "$versions" ]]; then
      local version_count=$(echo "$versions" | wc -l | tr -d ' ')
      if [[ $version_count -gt 1 ]]; then
        echo "⚠️  Multiple versions found in $lock_file:"
        echo "$versions" | sed 's/^/    /'
        found_stale=1
      else
        echo "✓ Single version in $lock_file: $versions"
      fi
    fi
  done

  if [[ $found_stale -eq 1 ]]; then
    echo -e "\n⚠️  Warning: Multiple versions detected. Consider running 'yarn install' at the root to deduplicate."
  fi
}

# Function to update a single package
update_package() {
  local pkg_name="$1"
  local version="$2"
  local target_path="$3"

  # Build list of project directories containing the target package
  scan_base="$ROOT_DIR"
  if [[ -n "$target_path" ]]; then
    if [[ -f "$target_path" ]]; then
      scan_base="$(dirname "$target_path")"
    else
      scan_base="$target_path"
    fi
  fi

  PROJECT_DIRS=()
  while IFS= read -r line; do
    PROJECT_DIRS+=("$line")
  done < <(
    find "$scan_base" -type f -name package.json -not -path '*/node_modules/*' \
      -exec grep -l "\"$pkg_name\"" {} + \
    | xargs -n1 dirname \
    | sort -u
  )

  if [[ ${#PROJECT_DIRS[@]} -eq 0 ]]; then
    echo "No projects found with $pkg_name under: $scan_base"
    return
  fi

  echo "Found ${#PROJECT_DIRS[@]} projects to update for $pkg_name ($version)."

  for dir in "${PROJECT_DIRS[@]}"; do
    printf "\n==> Updating %s\n" "$dir"
    pushd "$dir" >/dev/null
    # Capture current spec (so we can preserve "*" if that's the chosen policy)
    CURRENT_SPEC=$(node -e "const p=require('./package.json'); const k='${pkg_name}'; const s=(p.dependencies&&p.dependencies[k])||(p.devDependencies&&p.devDependencies[k])||''; process.stdout.write(s);")

    # Function to run yarn command with retry on outdated lockfile
    run_yarn_with_retry() {
      local cmd="$1"
      local max_retries=2
      local retry_count=0

      while [[ $retry_count -le $max_retries ]]; do
        if [[ $retry_count -gt 0 ]]; then
          echo "  Retry attempt $retry_count/$max_retries after outdated lockfile error..."
        fi

        # Run the command and capture output and exit code
        if eval "$cmd" 2>&1 | tee /tmp/yarn_output_$$.txt; then
          rm -f /tmp/yarn_output_$$.txt
          return 0
        fi

        # Check if the error was due to outdated lockfile
        if grep -q "Outdated lockfile" /tmp/yarn_output_$$.txt; then
          echo "  ⚠️  Outdated lockfile detected. Running 'yarn install' to fix..."
          rm -f /tmp/yarn_output_$$.txt
          yarn install
          retry_count=$((retry_count + 1))
        else
          # Some other error occurred, don't retry
          rm -f /tmp/yarn_output_$$.txt
          return 1
        fi
      done

      echo "  ❌ Failed after $max_retries retries"
      rm -f /tmp/yarn_output_$$.txt
      return 1
    }

    if [[ "$version" == "latest" ]] || [[ "$version" == "*" ]]; then
      echo "yarn upgrade $pkg_name"
      if ! run_yarn_with_retry "yarn upgrade \"$pkg_name\""; then
        echo "  ⚠️  Failed to upgrade $pkg_name in $dir, skipping..."
        popd >/dev/null
        continue
      fi
      # Set to '*' in package.json
      ESCAPED_NAME=${pkg_name//\//\\/}
      perl -0777 -i -pe "s/(\"${ESCAPED_NAME}\"\s*:\s*)\"[^\"]+\"/\${1}\"*\"/g" package.json
      echo "Set ${pkg_name} spec to '*' in package.json"
    else
      echo "yarn add $pkg_name@$version"
      if ! run_yarn_with_retry "yarn add \"$pkg_name@$version\""; then
        echo "  ⚠️  Failed to add $pkg_name@$version in $dir, skipping..."
        popd >/dev/null
        continue
      fi
      # If the project previously used '*' keep it that way in package.json while retaining the new lockfile resolution
      if [[ "$CURRENT_SPEC" == "*" ]]; then
        ESCAPED_NAME=${pkg_name//\//\\/}
        perl -0777 -i -pe "s/(\"${ESCAPED_NAME}\"\s*:\s*)\"[^\"]+\"/\${1}\"*\"/g" package.json
        echo "Restored ${pkg_name} spec to '*' in package.json"
      fi
    fi
    popd >/dev/null
  done

  # Check for stale versions after update
  check_stale_versions "$pkg_name"
}

# If no arguments, update both packages to '*' (only if needed)
if [[ $# -eq 0 ]]; then
  echo "No arguments provided. Checking if updates are needed for @civic/auth-web3 and @civic/auth..."

  # Get latest versions
  AUTH_WEB3_LATEST=$(get_latest_version "@civic/auth-web3")
  AUTH_LATEST=$(get_latest_version "@civic/auth")

  if [[ -z "$AUTH_WEB3_LATEST" ]] || [[ -z "$AUTH_LATEST" ]]; then
    echo "Error: Could not fetch latest versions from npm" >&2
    exit 1
  fi

  echo "Latest versions: @civic/auth-web3@$AUTH_WEB3_LATEST, @civic/auth@$AUTH_LATEST"

  # Check current versions in lockfiles
  AUTH_WEB3_CURRENT=$(get_lockfile_versions "@civic/auth-web3")
  AUTH_CURRENT=$(get_lockfile_versions "@civic/auth")

  echo -e "\nCurrent resolved versions:"
  if [[ -n "$AUTH_WEB3_CURRENT" ]]; then
    echo "  @civic/auth-web3: $(echo "$AUTH_WEB3_CURRENT" | tr '\n' ', ' | sed 's/,$//')"
  else
    echo "  @civic/auth-web3: (not found)"
  fi
  if [[ -n "$AUTH_CURRENT" ]]; then
    echo "  @civic/auth: $(echo "$AUTH_CURRENT" | tr '\n' ', ' | sed 's/,$//')"
  else
    echo "  @civic/auth: (not found)"
  fi

  # Determine what needs updating
  UPDATE_WEB3=0
  UPDATE_AUTH=0

  if needs_update "@civic/auth-web3" "$AUTH_WEB3_LATEST"; then
    UPDATE_WEB3=1
  fi

  if needs_update "@civic/auth" "$AUTH_LATEST"; then
    UPDATE_AUTH=1
  fi

  # Only update packages that need it
  if [[ $UPDATE_WEB3 -eq 0 ]] && [[ $UPDATE_AUTH -eq 0 ]]; then
    echo -e "\n✓ All packages are already at the latest version. No updates needed."
    exit 0
  fi

  echo -e "\nPackages to update:"
  if [[ $UPDATE_WEB3 -eq 1 ]]; then
    echo "  - @civic/auth-web3 → $AUTH_WEB3_LATEST"
  fi
  if [[ $UPDATE_AUTH -eq 1 ]]; then
    echo "  - @civic/auth → $AUTH_LATEST"
  fi

  if [[ $UPDATE_WEB3 -eq 1 ]]; then
    update_package "@civic/auth-web3" "*" ""
  fi

  if [[ $UPDATE_AUTH -eq 1 ]]; then
    update_package "@civic/auth" "*" ""
  fi

  echo -e "\nAll done."
  exit 0
fi

TARGET_KIND="$1"     # web3 | auth
VERSION="${2:-latest}"
TARGET_PATH="${3:-}"

case "$TARGET_KIND" in
  web3) PKG_NAME="@civic/auth-web3" ;;
  auth) PKG_NAME="@civic/auth" ;;
  *) echo "First arg must be 'web3' or 'auth'" >&2; exit 1;;
esac

update_package "$PKG_NAME" "$VERSION" "$TARGET_PATH"

echo -e "\nAll done."


