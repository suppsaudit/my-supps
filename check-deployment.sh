#!/bin/bash

echo "🔍 MY SUPPS Deployment Check"
echo "============================"
echo ""

# Check GitHub Pages URL
echo "📱 Checking deployment URLs..."
echo ""

# GitHub Pages URL
GITHUB_PAGES_URL="https://suppsaudit.github.io/my-supps/"
echo "1. GitHub Pages URL:"
echo "   $GITHUB_PAGES_URL"
echo "   Status: $(curl -o /dev/null -s -w "%{http_code}" $GITHUB_PAGES_URL)"
echo ""

# Vercel URLs (possible patterns)
echo "2. Possible Vercel URLs:"
VERCEL_URLS=(
    "https://my-supps.vercel.app"
    "https://my-supps-suppsaudit.vercel.app"
    "https://my-supps-git-main-suppsaudit.vercel.app"
)

for url in "${VERCEL_URLS[@]}"; do
    echo "   $url"
    echo "   Status: $(curl -o /dev/null -s -w "%{http_code}" $url)"
done

echo ""
echo "💡 Status codes:"
echo "   200 = Working ✅"
echo "   404 = Not found ❌"
echo "   000 = No connection ❌"
echo ""
echo "📝 GitHub Pages setup:"
echo "   1. Go to: https://github.com/suppsaudit/my-supps/settings/pages"
echo "   2. Set Source: main branch, / (root)"
echo "   3. Wait 2-3 minutes"
echo "   4. Access: https://suppsaudit.github.io/my-supps/"