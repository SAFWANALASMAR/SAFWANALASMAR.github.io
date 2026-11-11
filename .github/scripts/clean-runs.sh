#!/usr/bin/env bash
# يحذف سجلات التشغيل القديمة ويُبقي أحدث تشغيل من كل مسار.
# Deletes old workflow runs, keeping the newest run of each workflow. Earlier runs of the cleanup button
# itself all go: a run cannot delete itself, so only the press that is running now is left.
# Needs GH_TOKEN (actions: write) and GH_REPO (owner/name).
set -euo pipefail

list=$(mktemp)
gh api "repos/$GH_REPO/actions/runs?per_page=100" --paginate \
  -q '.workflow_runs[] | "\(.workflow_id) \(.created_at) \(.id) \(.status) \(.path)"' \
  | sort -k1,1 -k2,2r \
  | awk -v self=".github/workflows/cleanup.yml" \
      '{ newest = !seen[$1]++ } $4 == "completed" && ($5 == self || !newest) { print $3 }' > "$list"

count=0
while read -r id; do
  gh api -X DELETE "repos/$GH_REPO/actions/runs/$id" > /dev/null && count=$((count + 1))
done < "$list"
echo "حُذف $count تشغيلاً قديماً، وبقي الأحدث من كل مسار." | tee -a "${GITHUB_STEP_SUMMARY:-/dev/null}"
