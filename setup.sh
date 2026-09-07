#!/bin/bash

# Setup script for development

echo "🚀 Installing dependencies..."
npm install

echo "📝 Building userscript..."
npm run build

echo "✓ Setup complete!"
echo ""
echo "Available commands:"
echo "  npm run build          - Build the userscript"
echo "  npm run dev            - Watch mode for development"
echo "  npm test               - Run tests"
echo "  npm run lint           - Check code style"
echo "  npm run format         - Auto-format code"
echo ""
echo "Next steps:"
echo "  1. Open dist/mapartcraft-auto-colour-match.user.js in your editor"
echo "  2. Copy the entire file content"
echo "  3. Create a new script in Tampermonkey and paste the content"
echo "  4. Visit https://mike2b2t.github.io/mapartcraft/ to test"
