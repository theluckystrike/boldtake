#!/bin/bash
# Enterprise-grade pre-commit validation
# This runs BEFORE code reaches the repository

set -e  # Exit on any error

echo "🚀 BoldTake Pre-Commit Validation Starting..."
echo "============================================"

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Track if any checks fail
FAILED=0

# 1. Check for debugging code
echo -n "🔍 Checking for console.log statements... "
if grep -r "console\.log" --include="*.js" --exclude-dir=node_modules --exclude-dir=test --exclude="*test*" --exclude="*debug*" . > /dev/null 2>&1; then
    echo -e "${RED}✗${NC}"
    echo "   Found console.log in:"
    grep -r "console\.log" --include="*.js" --exclude-dir=node_modules --exclude-dir=test --exclude="*test*" . | head -5
    FAILED=1
else
    echo -e "${GREEN}✓${NC}"
fi

# 2. Check for debugger statements
echo -n "🔍 Checking for debugger statements... "
if grep -r "debugger" --include="*.js" --exclude-dir=node_modules . > /dev/null 2>&1; then
    echo -e "${RED}✗${NC}"
    echo "   Found debugger in:"
    grep -r "debugger" --include="*.js" --exclude-dir=node_modules . | head -5
    FAILED=1
else
    echo -e "${GREEN}✓${NC}"
fi

# 3. Check for TODO comments without tickets
echo -n "📝 Checking for TODOs without ticket numbers... "
TODO_COUNT=$(grep -r "TODO" --include="*.js" --exclude-dir=node_modules . 2>/dev/null | grep -v "TODO(#" | wc -l)
if [ $TODO_COUNT -gt 0 ]; then
    echo -e "${YELLOW}⚠${NC} Found $TODO_COUNT TODOs without ticket numbers"
    echo "   Please add ticket numbers: // TODO(#123): Description"
fi

# 4. Validate manifest.json
echo -n "📋 Validating manifest.json... "
if python3 -m json.tool manifest.json > /dev/null 2>&1; then
    echo -e "${GREEN}✓${NC}"
else
    echo -e "${RED}✗${NC}"
    echo "   manifest.json is not valid JSON!"
    FAILED=1
fi

# 5. Check file sizes
echo -n "📦 Checking file sizes... "
LARGE_FILES=$(find . -type f -name "*.js" -size +500k 2>/dev/null)
if [ -n "$LARGE_FILES" ]; then
    echo -e "${YELLOW}⚠${NC}"
    echo "   Large files detected (>500KB):"
    echo "$LARGE_FILES"
else
    echo -e "${GREEN}✓${NC}"
fi

# 6. Security checks
echo -n "🔒 Running security checks... "
SECURITY_ISSUES=0

# Check for eval()
if grep -r "eval(" --include="*.js" --exclude-dir=node_modules . > /dev/null 2>&1; then
    echo -e "${RED}✗${NC}"
    echo "   Found eval() usage - SECURITY RISK!"
    SECURITY_ISSUES=1
    FAILED=1
fi

# Check for innerHTML
if grep -r "innerHTML" --include="*.js" --exclude-dir=node_modules . > /dev/null 2>&1; then
    if [ $SECURITY_ISSUES -eq 0 ]; then
        echo -e "${YELLOW}⚠${NC}"
        echo "   Found innerHTML usage - verify it's sanitized"
    fi
fi

if [ $SECURITY_ISSUES -eq 0 ] && [ -z "$LARGE_FILES" ]; then
    echo -e "${GREEN}✓${NC}"
fi

# 7. Check for hardcoded secrets
echo -n "🔑 Checking for hardcoded secrets... "
# Look for common secret patterns
if grep -rE "(api[_-]?key|apikey|secret|password|token|auth)" --include="*.js" --exclude-dir=node_modules . | grep -vE "(// |/\*|\* )" | grep -E "=\s*['\"]" > /dev/null 2>&1; then
    echo -e "${YELLOW}⚠${NC}"
    echo "   Potential secrets found - please verify they're not sensitive"
else
    echo -e "${GREEN}✓${NC}"
fi

# 8. Syntax validation
echo -n "✨ Validating JavaScript syntax... "
ERROR_COUNT=0
for file in $(find . -name "*.js" -not -path "./node_modules/*" -not -path "./test/*" 2>/dev/null); do
    if ! node -c "$file" > /dev/null 2>&1; then
        if [ $ERROR_COUNT -eq 0 ]; then
            echo -e "${RED}✗${NC}"
            echo "   Syntax errors found in:"
        fi
        echo "   - $file"
        ERROR_COUNT=$((ERROR_COUNT + 1))
        FAILED=1
    fi
done
if [ $ERROR_COUNT -eq 0 ]; then
    echo -e "${GREEN}✓${NC}"
fi

# 9. Check commit message format
echo -n "💬 Checking commit message... "
COMMIT_MSG=$(git log -1 --pretty=%B)
if echo "$COMMIT_MSG" | grep -qE "^(feat|fix|docs|style|refactor|test|chore|perf)(\(.+\))?: .{1,50}"; then
    echo -e "${GREEN}✓${NC}"
else
    echo -e "${YELLOW}⚠${NC}"
    echo "   Commit message doesn't follow conventional format"
    echo "   Expected: type(scope): description"
    echo "   Example: feat(auth): add login functionality"
fi

# 10. Check for merge conflicts
echo -n "🔀 Checking for merge conflict markers... "
if grep -r "<<<<<<< HEAD" --exclude-dir=.git . > /dev/null 2>&1; then
    echo -e "${RED}✗${NC}"
    echo "   Found merge conflict markers!"
    FAILED=1
else
    echo -e "${GREEN}✓${NC}"
fi

# 11. Verify critical files exist
echo -n "📂 Verifying critical files... "
MISSING_FILES=""
for file in manifest.json background.js contentScript.js popup.html popup.js; do
    if [ ! -f "$file" ]; then
        MISSING_FILES="$MISSING_FILES $file"
    fi
done
if [ -n "$MISSING_FILES" ]; then
    echo -e "${RED}✗${NC}"
    echo "   Missing files:$MISSING_FILES"
    FAILED=1
else
    echo -e "${GREEN}✓${NC}"
fi

# 12. Check for sensitive data in comments
echo -n "💭 Checking comments for sensitive data... "
if grep -r "password\|secret\|token\|key" --include="*.js" --exclude-dir=node_modules . | grep "//" > /dev/null 2>&1; then
    echo -e "${YELLOW}⚠${NC}"
    echo "   Found potential sensitive data in comments"
else
    echo -e "${GREEN}✓${NC}"
fi

echo "============================================"

# Final result
if [ $FAILED -eq 1 ]; then
    echo -e "${RED}❌ Pre-commit validation FAILED${NC}"
    echo "Please fix the issues above before committing."
    exit 1
else
    echo -e "${GREEN}✅ All pre-commit checks PASSED!${NC}"
    echo "Your code is ready to commit."
    
    # Show quick stats
    echo ""
    echo "📊 Quick Stats:"
    echo "   Files changed: $(git diff --cached --numstat | wc -l)"
    echo "   Lines added: $(git diff --cached --numstat | awk '{sum+=$1} END {print sum}')"
    echo "   Lines removed: $(git diff --cached --numstat | awk '{sum+=$2} END {print sum}')"
fi

exit 0
