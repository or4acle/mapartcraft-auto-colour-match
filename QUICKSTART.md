# Quick Start Guide

## For Users

### Installation (5 minutes)

1. **Install Tampermonkey**
   - [Chrome/Edge](https://chrome.google.com/webstore/detail/tampermonkey/dhdgffkkebhmkfjojejmpbldmpobp41)
   - [Firefox](https://addons.mozilla.org/en-US/firefox/addon/tampermonkey/)

2. **Download the userscript**
   - Go to [Releases](https://github.com/or4acle/mapartcraft-auto-colour-match/releases)
   - Click `mapartcraft-auto-colour-match.user.js`
   - Tampermonkey will open — click **Install**

3. **Visit MapartCraft**
   - https://mike2b2t.github.io/mapartcraft/
   - You'll see the "🎨 Auto Colour Match" panel

### Basic Usage

```
1. Upload your image to MapartCraft
2. Select optimization settings:
   - Mode: Fast/Balanced/Deep
   - Objective: Visual Style or Pixel Colour
   - Optimize Dithering: Yes/No
3. Click "Auto Match" and wait
4. Apply the best result or save as preset
```

## For Developers

### Setup (10 minutes)

```bash
# Clone and install
git clone https://github.com/or4acle/mapartcraft-auto-colour-match.git
cd mapartcraft-auto-colour-match
npm install

# Build the userscript
npm run build

# Run tests
npm test

# Format and lint
npm run lint
npm run format
```

### Development Workflow

```bash
# Watch mode - rebuilds on file changes
npm run dev

# Run tests in watch mode
npm run test:watch

# Check code quality
npm run lint

# Auto-format code
npm run format
```

### Testing Changes

1. Build: `npm run build`
2. Open `dist/mapartcraft-auto-colour-match.user.js` 
3. Copy entire file content
4. Create new userscript in Tampermonkey
5. Paste content
6. Test on https://mike2b2t.github.io/mapartcraft/

### Project Structure

```
mapartcraft-auto-colour-match/
├── src/
│   ├── scorer.js          # Color conversions & scoring
│   ├── engine.js          # Optimization algorithm
│   ├── dom-utils.js       # DOM element selection
│   ├── ui.js              # Panel UI
│   ├── storage.js         # Preset management
│   ├── notifications.js   # Notifications
│   ├── bootstrap.js       # Entry point
│   └── worker.js          # WebWorker (optional)
├── tests/
│   ├── scorer.test.js
│   ├── engine.test.js
│   └── storage.test.js
├── build.js               # Build script
├── package.json
├── README.md
└── CHANGELOG.md
```

### Key Concepts

#### Color Scoring

Two methods to compare images:

1. **Visual Style (Oklab)** - Perceptually accurate
   - Uses Oklab color space
   - Compares multi-scale statistics
   - Good for overall color "feel"

2. **Pixel Colour** - Exact matching
   - Compares every pixel
   - Per-pixel L² distance in RGB
   - Good for precise results

#### Search Modes

- **Fast**: 5×5×3 = 75 base candidates (~5s)
- **Balanced**: 7×7×5 = 245 base candidates (~30s)
- **Deep**: 11×11×7 = 847 base candidates (~2min)

Multiply by dithering options (2-3) if enabled.

#### Optimization Loop

```
1. Generate candidates based on mode
2. For each candidate:
   a. Apply settings to MapartCraft controls
   b. Wait for canvas redraw
   c. Extract canvas pixel data
   d. Compute score (Visual Style or Pixel Colour)
   e. Update best result if better
3. Apply best result to MapartCraft
4. Send notification
```

### Common Tasks

#### Add a new scoring method

Edit `src/scorer.js`:

```javascript
function scoreNewMethod(source, preview) {
  // Implement your scoring logic
  // Lower score = better match
  return score; // 0-1
}

// Export if needed:
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { scoreNewMethod };
}
```

Then add to `scorePreview()`:

```javascript
if (objective === 'new-method') {
  return scoreNewMethod(source, preview);
}
```

#### Add a new search mode

Edit `src/engine.js` in `SEARCH_MODES`:

```javascript
const SEARCH_MODES = {
  // ... existing modes ...
  ultra: {
    brightnessSteps: 15,
    contrastSteps: 15,
    saturationSteps: 9,
    ditheringOptions: ['ordered', 'diffusion', 'noise'],
  },
};
```

Then update UI dropdown in `src/ui.js`.

#### Debug scoring

Add logging in `src/scorer.js`:

```javascript
function scorePreview(source, preview, objective) {
  const score = objective === 'visual-style'
    ? scoreVisualStyle(source, preview)
    : scorePixelColour(source, preview);
  
  console.log(`[Scorer] ${objective}: ${score.toFixed(4)}`);
  return score;
}
```

### Testing

```bash
# Run all tests
npm test

# Run specific test file
npm test scorer.test.js

# Watch mode
npm run test:watch

# With coverage
npm run test:coverage
```

Example test:

```javascript
describe('My Feature', () => {
  it('should do something', () => {
    const result = myFunction(input);
    expect(result).toBe(expected);
  });
});
```

### Building for Release

```bash
# Ensure tests pass
npm test

# Lint and format
npm run lint
npm run format

# Build
npm run build

# Check dist/mapartcraft-auto-colour-match.user.js
ls -lh dist/

# Create release on GitHub with the .user.js file
```

## Troubleshooting

### "Cannot find module" errors

```bash
# Clean install
rm -rf node_modules package-lock.json
npm install
```

### Tests fail

```bash
# Update snapshots if needed
npm test -- -u

# Run with more details
npm test -- --verbose
```

### Build produces empty file

```bash
# Check src/ files exist
ls src/

# Try building again
npm run build

# Check console output for errors
```

### Userscript not injecting

- Check Tampermonkey is enabled
- Verify script URL matches `@match` directives in build.js
- Check browser console (F12) for errors
- Try different MapartCraft URL variant (with/without trailing slash)

## Contributing

1. Fork the repo
2. Create feature branch: `git checkout -b feature/your-feature`
3. Make changes and test: `npm test && npm run lint`
4. Commit: `git commit -m 'feat: add your feature'`
5. Push: `git push origin feature/your-feature`
6. Create Pull Request

Before submitting:
- ✅ All tests pass
- ✅ Code is linted and formatted
- ✅ CHANGELOG.md is updated
- ✅ Commits are small and descriptive

## Resources

- 📖 [README.md](./README.md) - Full documentation
- 📝 [CHANGELOG.md](./CHANGELOG.md) - Version history
- 🧪 [tests/](./tests/) - Unit test examples
- 🏗️ [src/](./src/) - Module documentation comments

## Getting Help

- 📋 Check [README.md](./README.md) troubleshooting section
- 🔍 Search existing [Issues](https://github.com/or4acle/mapartcraft-auto-colour-match/issues)
- 💬 Create a new [Issue](https://github.com/or4acle/mapartcraft-auto-colour-match/issues/new) with details
- 🐛 Include console errors (F12 → Console)

## Next Steps

- Read [README.md](./README.md) for full documentation
- Explore [tests/](./tests/) for code examples
- Look at [CHANGELOG.md](./CHANGELOG.md) for what changed
- Try modifying a module and running `npm run dev`

Happy coding! 🚀
