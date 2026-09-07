/**
 * UI Module - Panel injection, event binding, and display updates
 */

const PANEL_ID = 'mapartcraft-auto-colour-match-panel';
const PANEL_STYLES = `
#${PANEL_ID} {
  position: fixed;
  top: 10px;
  right: 10px;
  width: 380px;
  background: #1e1e1e;
  border: 2px solid #4a9eff;
  border-radius: 8px;
  padding: 16px;
  font-family: Arial, sans-serif;
  font-size: 13px;
  color: #e0e0e0;
  z-index: 10000;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.5);
  line-height: 1.4;
}

#${PANEL_ID} * {
  box-sizing: border-box;
}

#${PANEL_ID} .header {
  font-size: 16px;
  font-weight: bold;
  margin-bottom: 12px;
  color: #4a9eff;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

#${PANEL_ID} .close-btn {
  background: none;
  border: none;
  color: #e0e0e0;
  font-size: 18px;
  cursor: pointer;
  padding: 0;
  width: 24px;
  height: 24px;
}

#${PANEL_ID} .close-btn:hover {
  color: #4a9eff;
}

#${PANEL_ID} .control-group {
  margin-bottom: 12px;
}

#${PANEL_ID} label {
  display: block;
  margin-bottom: 4px;
  font-weight: 500;
  color: #b0b0b0;
}

#${PANEL_ID} select,
#${PANEL_ID} input[type="checkbox"] {
  padding: 6px 8px;
  background: #2d2d2d;
  border: 1px solid #404040;
  color: #e0e0e0;
  border-radius: 4px;
  font-size: 13px;
  cursor: pointer;
}

#${PANEL_ID} select {
  width: 100%;
}

#${PANEL_ID} select:hover,
#${PANEL_ID} select:focus {
  border-color: #4a9eff;
  outline: none;
}

#${PANEL_ID} input[type="checkbox"] {
  margin-right: 8px;
  cursor: pointer;
}

#${PANEL_ID} .checkbox-label {
  display: flex;
  align-items: center;
  margin-bottom: 8px;
}

#${PANEL_ID} .button-group {
  display: flex;
  gap: 8px;
  margin: 12px 0;
}

#${PANEL_ID} button {
  flex: 1;
  padding: 10px;
  background: #4a9eff;
  color: #1e1e1e;
  border: none;
  border-radius: 4px;
  font-weight: bold;
  cursor: pointer;
  font-size: 13px;
  transition: background 0.2s;
}

#${PANEL_ID} button:hover {
  background: #3a8ee0;
}

#${PANEL_ID} button:disabled {
  background: #606060;
  cursor: not-allowed;
  opacity: 0.6;
}

#${PANEL_ID} .progress-bar {
  width: 100%;
  height: 20px;
  background: #2d2d2d;
  border: 1px solid #404040;
  border-radius: 4px;
  overflow: hidden;
  margin: 8px 0;
}

#${PANEL_ID} .progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #4a9eff, #2dd4bf);
  width: 0%;
  transition: width 0.3s;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 11px;
  color: #1e1e1e;
  font-weight: bold;
}

#${PANEL_ID} .status {
  margin: 8px 0;
  padding: 8px;
  background: #2d2d2d;
  border-left: 3px solid #4a9eff;
  border-radius: 2px;
  font-size: 12px;
  max-height: 60px;
  overflow-y: auto;
}

#${PANEL_ID} .best-result {
  margin: 8px 0;
  padding: 10px;
  background: #2d2d2d;
  border: 1px solid #4a9eff;
  border-radius: 4px;
  font-size: 12px;
  font-family: monospace;
}

#${PANEL_ID} .preset-group {
  margin: 8px 0;
  display: flex;
  gap: 6px;
}

#${PANEL_ID} .preset-group select {
  flex: 1;
}

#${PANEL_ID} .preset-group button {
  flex: 0 0 auto;
  padding: 6px 10px;
  font-size: 12px;
}
`;

/**
 * Inject the UI panel into the page
 * @returns {HTMLElement} The panel element
 */
function injectPanel() {
  // Remove existing panel if any
  const existing = document.getElementById(PANEL_ID);
  if (existing) {
    existing.remove();
  }

  // Create panel
  const panel = document.createElement('div');
  panel.id = PANEL_ID;
  panel.innerHTML = `
    <div class="header">
      <span>🎨 Auto Colour Match</span>
      <button class="close-btn" id="${PANEL_ID}-close">×</button>
    </div>

    <div class="control-group">
      <label for="${PANEL_ID}-mode">Mode:</label>
      <select id="${PANEL_ID}-mode">
        <option value="fast">Fast</option>
        <option value="balanced" selected>Balanced</option>
        <option value="deep">Deep</option>
      </select>
    </div>

    <div class="control-group">
      <label for="${PANEL_ID}-objective">Objective:</label>
      <select id="${PANEL_ID}-objective">
        <option value="visual-style" selected>Visual Style (Oklab)</option>
        <option value="pixel-colour">Pixel Colour</option>
      </select>
    </div>

    <div class="control-group">
      <label class="checkbox-label">
        <input type="checkbox" id="${PANEL_ID}-dithering" />
        Optimize Dithering
      </label>
    </div>

    <div class="button-group">
      <button id="${PANEL_ID}-start">Auto Match</button>
      <button id="${PANEL_ID}-stop" disabled>Stop</button>
    </div>

    <div class="progress-bar">
      <div class="progress-fill" id="${PANEL_ID}-progress"></div>
    </div>

    <div class="status" id="${PANEL_ID}-status">Ready</div>

    <div class="best-result" id="${PANEL_ID}-result" style="display:none;">
      <strong>Best Result:</strong><br/>
      <span id="${PANEL_ID}-result-text"></span>
    </div>

    <div class="control-group">
      <label for="${PANEL_ID}-presets">Presets:</label>
      <div class="preset-group">
        <select id="${PANEL_ID}-presets"></select>
        <button id="${PANEL_ID}-preset-save">Save</button>
        <button id="${PANEL_ID}-preset-load">Load</button>
        <button id="${PANEL_ID}-preset-delete">Delete</button>
      </div>
    </div>
  `;

  // Add styles
  if (!document.getElementById(`${PANEL_ID}-styles`)) {
    const style = document.createElement('style');
    style.id = `${PANEL_ID}-styles`;
    style.textContent = PANEL_STYLES;
    document.head.appendChild(style);
  }

  document.body.appendChild(panel);

  return panel;
}

/**
 * Get panel elements
 * @returns {object} Object with element references
 */
function getPanelElements() {
  return {
    panel: document.getElementById(PANEL_ID),
    mode: document.getElementById(`${PANEL_ID}-mode`),
    objective: document.getElementById(`${PANEL_ID}-objective`),
    dithering: document.getElementById(`${PANEL_ID}-dithering`),
    startBtn: document.getElementById(`${PANEL_ID}-start`),
    stopBtn: document.getElementById(`${PANEL_ID}-stop`),
    progressFill: document.getElementById(`${PANEL_ID}-progress`),
    status: document.getElementById(`${PANEL_ID}-status`),
    result: document.getElementById(`${PANEL_ID}-result`),
    resultText: document.getElementById(`${PANEL_ID}-result-text`),
    presets: document.getElementById(`${PANEL_ID}-presets`),
    closeBtn: document.getElementById(`${PANEL_ID}-close`),
  };
}

/**
 * Update progress display
 * @param {number} progress - Progress 0-100
 * @param {number} attempts - Current attempt number
 * @param {number} total - Total attempts
 */
function updateProgress(progress, attempts, total) {
  const { progressFill, status } = getPanelElements();
  if (progressFill) {
    progressFill.style.width = `${progress}%`;
    progressFill.textContent = `${progress}%`;
  }
  if (status) {
    status.textContent = `Attempt ${attempts} / ${total}...`;
  }
}

/**
 * Update status message
 * @param {string} message - Status message
 */
function updateStatus(message) {
  const { status } = getPanelElements();
  if (status) {
    status.textContent = message;
  }
}

/**
 * Display best result
 * @param {object} result - Best result object
 */
function displayBestResult(result) {
  const { result: elem, resultText } = getPanelElements();
  if (elem && resultText) {
    elem.style.display = 'block';
    const score = (result.score * 100).toFixed(2);
    resultText.innerHTML = `
B: ${result.brightness} | C: ${result.contrast} | S: ${result.saturation}<br/>
Dither: ${result.dithering || 'none'}<br/>
Score: ${score}%
    `.trim();
  }
}

/**
 * Enable/disable controls
 * @param {boolean} enabled - True to enable
 */
function setControlsEnabled(enabled) {
  const { mode, objective, dithering, startBtn, stopBtn, presets } = getPanelElements();
  if (mode) mode.disabled = !enabled;
  if (objective) objective.disabled = !enabled;
  if (dithering) dithering.disabled = !enabled;
  if (startBtn) startBtn.disabled = !enabled;
  if (stopBtn) stopBtn.disabled = enabled;
  if (presets) presets.disabled = !enabled;
}

/**
 * Get current settings from panel
 * @returns {object} Settings {mode, objective, optimizeDithering}
 */
function getSettings() {
  const { mode, objective, dithering } = getPanelElements();
  return {
    mode: mode?.value || 'balanced',
    objective: objective?.value || 'visual-style',
    optimizeDithering: dithering?.checked || false,
  };
}

/**
 * Apply settings to panel
 * @param {object} settings - Settings object
 */
function applySettings(settings) {
  const { mode, objective, dithering } = getPanelElements();
  if (mode && settings.mode) mode.value = settings.mode;
  if (objective && settings.objective) objective.value = settings.objective;
  if (dithering) dithering.checked = settings.optimizeDithering || false;
}

/**
 * Update presets dropdown
 * @param {object} presets - Map of preset names
 * @param {string} selected - Selected preset name
 */
function updatePresetsDropdown(presets, selected = null) {
  const { presets: elem } = getPanelElements();
  if (!elem) return;

  elem.innerHTML = '<option value="">-- Select Preset --</option>';
  for (const name of Object.keys(presets)) {
    const opt = document.createElement('option');
    opt.value = name;
    opt.textContent = name;
    if (name === selected) opt.selected = true;
    elem.appendChild(opt);
  }
}

/**
 * Get selected preset name
 * @returns {string|null} Selected preset name or null
 */
function getSelectedPreset() {
  const { presets } = getPanelElements();
  const value = presets?.value;
  return value && value !== '' ? value : null;
}

// Export for use
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    injectPanel,
    getPanelElements,
    updateProgress,
    updateStatus,
    displayBestResult,
    setControlsEnabled,
    getSettings,
    applySettings,
    updatePresetsDropdown,
    getSelectedPreset,
  };
}
