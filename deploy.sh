#!/bin/bash

# MY SUPPS - Deployment Helper Script
echo "🚀 MY SUPPS Deployment Helper"
echo "=============================="

# Check if we're in the web directory
if [ ! -f "index.html" ]; then
    echo "❌ Error: Not in my-supps-web directory"
    echo "Please run: cd /Users/air/Desktop/my-supps/my-supps-web"
    exit 1
fi

echo "📁 Current directory: $(pwd)"
echo ""

# Git status check
echo "📊 Git Status:"
git status -s
echo ""

# Show deployment options
echo "🎯 Deployment Options:"
echo ""
echo "1. Update existing deployment (recommended):"
echo "   git add ."
echo "   git commit -m 'Update description'"
echo "   git push origin main"
echo ""
echo "2. View current deployment:"
echo "   GitHub: https://github.com/suppsaudit/my-supps"
echo "   Vercel: Check GitHub page for deployment URL"
echo ""
echo "3. Create new Vercel project (if needed):"
echo "   - Login to https://vercel.com with your account"
echo "   - Import from GitHub: suppsaudit/my-supps"
echo "   - Settings: Framework=Other, Output=./"
echo ""
echo "💡 Tip: Vercel automatically deploys when you push to GitHub!"