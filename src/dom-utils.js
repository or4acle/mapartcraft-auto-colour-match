/**
 * DOM Utils Module - Robust DOM selection and manipulation
 */

/**
 * Find element by label text or fallback by class/id
 * @param {string} labelText - Text to search for in labels
 * @param {string} fallbackSelector - CSS selector fallback
 * @returns {HTMLElement|null} Found element or null
 */
function findElementByLabel(labelText, fallbackSelector = null) {
  // Search by label
  const labels = document.querySelectorAll('label');
  for (const label of labels) {
    if (label.textContent.includes(labelText)) {
      // Look for associated input/select
      const inputId = label.htmlFor;
      if (inputId) {
        const elem = document.getElementById(inputId);
        if (elem) return elem;
      }
      // Look for child input/select
      const child = label.querySelector('input, select, textarea');
      if (child) return child;
    }
  }

  // Fallback to selector
  if (fallbackSelector) {
    return document.querySelector(fallbackSelector);
  }

  return null;
}

/**
 * Find element by text content
 * @param {string} text - Text to search for
 * @param {string} tagName - Optional tag name to filter
 * @returns {HTMLElement|null} Found element or null
 */
function findElementByText(text, tagName = '*') {
  const elements = document.querySelectorAll(tagName);
  for (const elem of elements) {
    if (elem.textContent.trim() === text.trim()) {
      return elem;
    }
  }
  return null;
}

/**
 * Set native input value and trigger change events
 * @param {HTMLInputElement} input - Input element
 * @param {string|number} value - Value to set
 */
function setNativeValue(input, value) {
  const proto = Object.getPrototypeOf(input);
  const descriptor = Object.getOwnPropertyDescriptor(proto, 'value');

  if (descriptor && descriptor.set) {
    descriptor.set.call(input, value);
  } else {
    input.value = value;
  }

  // Trigger change and input events
  input.dispatchEvent(new Event('input', { bubbles: true }));
  input.dispatchEvent(new Event('change', { bubbles: true }));
}

/**
 * Set native select value and trigger change events
 * @param {HTMLSelectElement} select - Select element
 * @param {string} value - Value to set
 */
function setNativeSelectValue(select, value) {
  const proto = Object.getPrototypeOf(select);
  const descriptor = Object.getOwnPropertyDescriptor(proto, 'value');

  if (descriptor && descriptor.set) {
    descriptor.set.call(select, value);
  } else {
    select.value = value;
  }

  // Trigger change event
  select.dispatchEvent(new Event('change', { bubbles: true }));
}

/**
 * Get canvas ImageData safely
 * @param {HTMLCanvasElement} canvas - Canvas element
 * @returns {ImageData|null} Canvas image data or null
 */
function getCanvasImageData(canvas) {
  try {
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return null;
    return ctx.getImageData(0, 0, canvas.width, canvas.height);
  } catch (e) {
    console.error('Failed to get canvas ImageData:', e);
    return null;
  }
}

/**
 * Compute simple hash of canvas data (for caching)
 * @param {HTMLCanvasElement} canvas - Canvas element
 * @returns {string} Hash string
 */
function getCanvasHash(canvas) {
  if (!canvas || !canvas.width || !canvas.height) {
    return 'empty';
  }

  try {
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return 'no-context';

    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;

    // Sample every 100th pixel for speed
    let hash = 0;
    for (let i = 0; i < data.length; i += 400) {
      hash = ((hash << 5) - hash) + data[i];
      hash = hash & hash; // Convert to 32bit integer
    }

    return Math.abs(hash).toString(36);
  } catch (e) {
    console.error('Failed to compute canvas hash:', e);
    return 'error';
  }
}

/**
 * Wait for canvas to change (detect redraw)
 * @param {HTMLCanvasElement} canvas - Canvas to monitor
 * @param {number} maxWait - Maximum wait time in ms
 * @param {number} interval - Check interval in ms
 * @returns {Promise<boolean>} True if changed, false if timeout
 */
function waitForCanvasChange(canvas, maxWait = 2000, interval = 50) {
  return new Promise((resolve) => {
    const initialHash = getCanvasHash(canvas);
    const startTime = Date.now();

    const checker = setInterval(() => {
      const currentHash = getCanvasHash(canvas);
      if (currentHash !== initialHash) {
        clearInterval(checker);
        resolve(true);
      } else if (Date.now() - startTime > maxWait) {
        clearInterval(checker);
        resolve(false);
      }
    }, interval);
  });
}

/**
 * Find brightness/contrast/saturation sliders or inputs
 * @returns {object} {brightness, contrast, saturation} HTMLElements or null
 */
function findPreprocessingControls() {
  const controls = {
    brightness: null,
    contrast: null,
    saturation: null,
  };

  // Try to find by label
  controls.brightness = findElementByLabel('Brightness', 'input[name*="brightness"]');
  controls.contrast = findElementByLabel('Contrast', 'input[name*="contrast"]');
  controls.saturation = findElementByLabel('Saturation', 'input[name*="saturation"]');

  return controls;
}

/**
 * Find dithering selector
 * @returns {HTMLSelectElement|null} Dithering select element
 */
function findDitheringSelector() {
  return findElementByLabel('Dithering', 'select[name*="dither"]');
}

/**
 * Find source and preview canvases
 * @returns {object} {source, preview} Canvas elements or null
 */
function findCanvases() {
  const canvases = document.querySelectorAll('canvas');
  let source = null;
  let preview = null;

  // Heuristic: typically source is first, preview is second
  if (canvases.length >= 2) {
    source = canvases[0];
    preview = canvases[1];
  } else if (canvases.length === 1) {
    // Single canvas: try to guess
    source = canvases[0];
    preview = canvases[0];
  }

  return { source, preview };
}

/**
 * Check if all preprocessing controls exist
 * @param {object} controls - Controls object from findPreprocessingControls()
 * @returns {boolean} True if all controls found
 */
function hasAllControls(controls) {
  return (
    controls.brightness &&
    controls.contrast &&
    controls.saturation
  );
}

// Export for testing
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    findElementByLabel,
    findElementByText,
    setNativeValue,
    setNativeSelectValue,
    getCanvasImageData,
    getCanvasHash,
    waitForCanvasChange,
    findPreprocessingControls,
    findDitheringSelector,
    findCanvases,
    hasAllControls,
  };
}
