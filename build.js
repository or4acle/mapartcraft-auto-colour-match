/**
 * Build script - Bundles userscript into single file
 */

const fs = require('fs');
const path = require('path');

const SRC_DIR = path.join(__dirname, 'src');
const DIST_DIR = path.join(__dirname, 'dist');
const OUTPUT_FILE = path.join(DIST_DIR, 'mapartcraft-auto-colour-match.user.js');

// Ensure dist directory exists
if (!fs.existsSync(DIST_DIR)) {
  fs.mkdirSync(DIST_DIR, { recursive: true });
}

/**
 * Read module file
 */
function readModule(filename) {
  const filepath = path.join(SRC_DIR, filename);
  const content = fs.readFileSync(filepath, 'utf8');
  
  // Remove module.exports for bundling
  return content
    .replace(/if \(typeof module !== 'undefined'.*?\}\s*$/ms, '')
    .trim();
}

/**
 * Build userscript
 */
function build() {
  console.log('Building MapartCraft Auto Colour Match...');

  const userscriptHeader = `// ==UserScript==
// @name         MapartCraft Auto Colour Match
// @namespace    https://github.com/or4acle/mapartcraft-auto-colour-match
// @version      1.0.0
// @description  Automatically optimize image color preprocessing for MapartCraft
// @author       or4acle
// @match        https://mike2b2t.github.io/mapartcraft/*
// @match        https://rebane2001.com/mapartcraft/*
// @match        https://*/mapartcraft/*
// @grant        GM_notification
// @grant        unsafeWindow
// @run-at       document-end
// ==/UserScript==

(function() {
  'use strict';

`;

  const userscriptFooter = `
  // Initialize and start
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeUserscript);
  } else {
    initializeUserscript();
  }
})();
`;

  // Read all modules
  const scorer = readModule('scorer.js');
  const domUtils = readModule('dom-utils.js');
  const engine = readModule('engine.js');
  const storage = readModule('storage.js');
  const notifications = readModule('notifications.js');
  const ui = readModule('ui.js');
  const bootstrap = readModule('bootstrap.js');

  // Combine all
  const content =
    userscriptHeader +
    `\n  // ===== SCORER MODULE =====\n${scorer}\n` +
    `\n  // ===== DOM UTILS MODULE =====\n${domUtils}\n` +
    `\n  // ===== ENGINE MODULE =====\n${engine}\n` +
    `\n  // ===== STORAGE MODULE =====\n${storage}\n` +
    `\n  // ===== NOTIFICATIONS MODULE =====\n${notifications}\n` +
    `\n  // ===== UI MODULE =====\n${ui}\n` +
    `\n  // ===== BOOTSTRAP MODULE =====\n${bootstrap}\n` +
    userscriptFooter;

  // Write output
  fs.writeFileSync(OUTPUT_FILE, content, 'utf8');
  console.log(`✓ Built: ${OUTPUT_FILE}`);
  console.log(`✓ Size: ${(fs.statSync(OUTPUT_FILE).size / 1024).toFixed(2)} KB`);
}

// Watch mode
if (process.argv.includes('--watch')) {
  console.log('Watching for changes...');
  fs.watch(SRC_DIR, { recursive: true }, (eventType, filename) => {
    if (filename && filename.endsWith('.js')) {
      console.log(`\nChanged: ${filename}`);
      try {
        build();
      } catch (error) {
        console.error('Build error:', error.message);
      }
    }
  });
} else {
  try {
    build();
  } catch (error) {
    console.error('Build failed:', error.message);
    process.exit(1);
  }
}
