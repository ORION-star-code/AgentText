#!/bin/bash
# Read today's review report, output JSON for SessionStart hook
DATE=$(date +%Y-%m-%d)
REVIEW_FILE="C:/Users/ORION/Desktop/AgentText/docs/reviews/${DATE}.md"

if [ ! -f "$REVIEW_FILE" ]; then
  exit 0
fi

TOTAL=$(grep -c "^###\|^-\s\*\*" "$REVIEW_FILE" 2>/dev/null || echo 0)
HIGH=$(grep -ci "severity.*high\|high.*severity" "$REVIEW_FILE" 2>/dev/null || echo 0)
MEDIUM=$(grep -ci "severity.*medium\|medium.*severity" "$REVIEW_FILE" 2>/dev/null || echo 0)

cat <<EOF
{"hookSpecificOutput":{"hookEventName":"SessionStart","additionalContext":"## Review Report Pending (${DATE})\n\nFile: docs/reviews/${DATE}.md\nFound ${TOTAL} issues (High: ${HIGH}, Medium: ${MEDIUM})\n\nRead this file at session start and list improvement items."}}
EOF
