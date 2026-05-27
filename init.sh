#!/bin/bash
set -e

echo "=== CodeInsight Agent - Harness Initialization ==="

if [ -f "package.json" ]; then
  echo "=== Installing dependencies ==="
  npm install

  echo "=== Type checking ==="
  npx tsc --noEmit

  echo "=== Running tests ==="
  npm test

  echo "=== Building application ==="
  npm run build
else
  echo "=== package.json not found, skipping npm commands ==="
  echo "=== Please initialize the project first ==="
fi

echo ""
echo "=== Verification Complete ==="
echo ""
echo "Next steps:"
echo "1. Read feature_list.json to see current feature state"
echo "2. Pick ONE unfinished feature to work on"
echo "3. Implement only that feature"
echo "4. Re-run verification before claiming done"
