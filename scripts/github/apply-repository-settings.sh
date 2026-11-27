#!/usr/bin/env bash
# Applies the repository settings kept in .github/settings/ to GitHub.
#
#   scripts/github/apply-repository-settings.sh            preview only
#   scripts/github/apply-repository-settings.sh --apply    make the changes
#
# Needs the GitHub CLI signed in as a repository administrator. Preview mode
# reads the current settings and prints what would change; it changes nothing.
# Override the target with REPOSITORY=owner/name.

set -euo pipefail

REPOSITORY="${REPOSITORY:-Healthalyst-Africa/healthalyst-frontend}"
SETTINGS_DIRECTORY="$(cd "$(dirname "${BASH_SOURCE[0]}")/../../.github/settings" && pwd)"
APPLY=false

for argument in "$@"; do
  case "$argument" in
    --apply) APPLY=true ;;
    --help | -h)
      sed -n '2,10p' "${BASH_SOURCE[0]}"
      exit 0
      ;;
    *)
      echo "Unknown option: $argument" >&2
      exit 1
      ;;
  esac
done

if ! gh auth status >/dev/null 2>&1; then
  echo "Sign in to the GitHub CLI first: gh auth login" >&2
  exit 1
fi

announce() {
  if [ "$APPLY" = true ]; then
    echo "Applying: $1"
  else
    echo "Would apply: $1"
  fi
}

apply_ruleset() {
  local ruleset_file="$1"
  local ruleset_name
  ruleset_name="$(node -e 'process.stdout.write(JSON.parse(require("fs").readFileSync(process.argv[1], "utf8")).name)' "$ruleset_file")"
  local existing_identifier
  existing_identifier="$(gh api "repos/${REPOSITORY}/rulesets" \
    --jq ".[] | select(.name == \"${ruleset_name}\") | .id")"

  if [ -n "$existing_identifier" ]; then
    announce "update ruleset \"${ruleset_name}\" (${existing_identifier}) from $(basename "$ruleset_file")"
    if [ "$APPLY" = true ]; then
      gh api --method PUT "repos/${REPOSITORY}/rulesets/${existing_identifier}" \
        --input "$ruleset_file" --jq '"  updated ruleset \(.id)"'
    fi
  else
    announce "create ruleset \"${ruleset_name}\" from $(basename "$ruleset_file")"
    if [ "$APPLY" = true ]; then
      gh api --method POST "repos/${REPOSITORY}/rulesets" \
        --input "$ruleset_file" --jq '"  created ruleset \(.id)"'
    fi
  fi
}

echo "Repository: ${REPOSITORY}"
echo
echo "Current state"
gh api "repos/${REPOSITORY}" --jq '
  "  delete branch on merge: \(.delete_branch_on_merge)",
  "  secret scanning: \(.security_and_analysis.secret_scanning.status // "unknown")",
  "  push protection: \(.security_and_analysis.secret_scanning_push_protection.status // "unknown")",
  "  Dependabot security updates: \(.security_and_analysis.dependabot_security_updates.status // "unknown")"'
gh api "repos/${REPOSITORY}/rulesets" --jq '"  rulesets: \([.[].name] | join(", ") | if . == "" then "none" else . end)"'
gh api "repos/${REPOSITORY}/actions/permissions/workflow" \
  --jq '"  default workflow token: \(.default_workflow_permissions)"'
echo

echo "Planned changes"
announce "repository settings from repository.json (secret scanning, push protection, Dependabot security updates, delete branches after merge)"
if [ "$APPLY" = true ]; then
  gh api --method PATCH "repos/${REPOSITORY}" --input "${SETTINGS_DIRECTORY}/repository.json" --jq '"  done"'
fi

announce "read-only default workflow token from workflow-permissions.json"
if [ "$APPLY" = true ]; then
  gh api --method PUT "repos/${REPOSITORY}/actions/permissions/workflow" \
    --input "${SETTINGS_DIRECTORY}/workflow-permissions.json"
  echo "  done"
fi

announce "Dependabot alerts and private vulnerability reporting"
if [ "$APPLY" = true ]; then
  gh api --method PUT "repos/${REPOSITORY}/vulnerability-alerts"
  gh api --method PUT "repos/${REPOSITORY}/private-vulnerability-reporting"
  echo "  done"
fi

apply_ruleset "${SETTINGS_DIRECTORY}/ruleset-main.json"
apply_ruleset "${SETTINGS_DIRECTORY}/ruleset-dev.json"

echo
if [ "$APPLY" = true ]; then
  echo "Settings applied. Review them under Settings → Rules and Settings → Advanced Security."
else
  echo "Nothing was changed. Run again with --apply to make these changes."
fi
