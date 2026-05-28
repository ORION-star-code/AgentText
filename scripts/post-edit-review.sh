#!/bin/bash
# PostToolUse command hook: spawn two review agents after code edits.
# Reads tool input JSON from stdin, extracts file path, launches reviews.

AGENT_DIR="C:/Users/ORION/Desktop/AgentText/.claude/agents"
REVIEW_DIR="C:/Users/ORION/Desktop/AgentText/docs/reviews"
DATE=$(date +%Y-%m-%d)
REVIEW_FILE="${REVIEW_DIR}/${DATE}.md"

mkdir -p "$REVIEW_DIR"

# Read tool input from stdin
INPUT=$(cat)

# Extract file path (works for both Write and Edit tool_input)
FILE_PATH=$(echo "$INPUT" | node -e "
  const d = JSON.parse(require('fs').readFileSync(0,'utf8'));
  console.log(d.file_path || d.filePath || '');
" 2>/dev/null)

# Skip non-TS/JS files and files outside src/
EXT="${FILE_PATH##*.}"
if [[ -z "$FILE_PATH" ]] || [[ ! "$EXT" =~ ^(ts|tsx|js|jsx)$ ]] || [[ ! "$FILE_PATH" =~ /src/ ]]; then
  echo '{"hookSpecificOutput":{"hookEventName":"PostToolUse","additionalContext":"Skipped: not a source file"}}'
  exit 0
fi

# Read the changed file content
if [[ ! -f "$FILE_PATH" ]]; then
  echo '{"hookSpecificOutput":{"hookEventName":"PostToolUse","additionalContext":"File not found, skipping review"}}'
  exit 0
fi
FILE_CONTENT=$(cat "$FILE_PATH")

# Read agent definitions
SECURITY_PROMPT=$(cat "$AGENT_DIR/security-reviewer.md" 2>/dev/null)
CODE_PROMPT=$(cat "$AGENT_DIR/senior-code-reviewer.md" 2>/dev/null)

# Append header if review file is new
if [[ ! -f "$REVIEW_FILE" ]]; then
  echo "# Code Review - ${DATE}" > "$REVIEW_FILE"
  echo "" >> "$REVIEW_FILE"
fi

# Build prompts
SECURITY_FULL="Review this file for security issues only. File: ${FILE_PATH}

${SECURITY_PROMPT}

---
FILE CONTENT:
${FILE_CONTENT}

Output ONLY a structured security review. No preamble."

CODE_FULL="Review this file for code quality only. File: ${FILE_PATH}

${CODE_PROMPT}

---
FILE CONTENT:
${FILE_CONTENT}

Output ONLY a structured code review. No preamble."

# Spawn both reviews in background (DISABLE_HOOKS prevents recursion)
DISABLE_HOOKS=1 claude -p "$SECURITY_FULL" --model sonnet --output-format text >> "${REVIEW_FILE}.sec" 2>/dev/null &
SEC_PID=$!

DISABLE_HOOKS=1 claude -p "$CODE_FULL" --model opus --output-format text >> "${REVIEW_FILE}.code" 2>/dev/null &
CODE_PID=$!

# Wait for both to finish
wait $SEC_PID $CODE_PID 2>/dev/null

# Append results to review file
{
  echo ""
  echo "### Review: \`${FILE_PATH}\`"
  echo ""
  echo "**Time:** $(date +%H:%M:%S)"
  echo ""
  echo "#### Security Review"
  echo ""
  cat "${REVIEW_FILE}.sec" 2>/dev/null || echo "(security review unavailable)"
  echo ""
  echo "#### Code Quality Review"
  echo ""
  cat "${REVIEW_FILE}.code" 2>/dev/null || echo "(code review unavailable)"
  echo ""
  echo "---"
} >> "$REVIEW_FILE"

# Cleanup temp files
rm -f "${REVIEW_FILE}.sec" "${REVIEW_FILE}.code"

echo "{\"hookSpecificOutput\":{\"hookEventName\":\"PostToolUse\",\"additionalContext\":\"Reviews saved to docs/reviews/${DATE}.md\"}}"
