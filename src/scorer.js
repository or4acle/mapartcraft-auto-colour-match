/**
 * Scorer Module - Color space conversions and similarity scoring
 * Handles Oklab color space, multi-scale analysis, and scoring algorithms
 */

/**
 * Convert sRGB value (0-255) to linear RGB (0-1)
 * @param {number} value - sRGB value (0-255)
 * @returns {number} Linear RGB value (0-1)
 */
function srgbToLinear(value) {
  const v = value / 255;
  if (v <= 0.04045) {
    return v / 12.92;
  }
  return Math.pow((v + 0.055) / 1.055, 2.4);
}

/**
 * Convert linear RGB (0-1) to sRGB (0-255)
 * @param {number} value - Linear RGB value (0-1)
 * @returns {number} sRGB value (0-255)
 */
function linearToSRGB(value) {
  if (value <= 0.0031308) {
    return Math.round(value * 12.92 * 255);
  }
  return Math.round((1.055 * Math.pow(value, 1 / 2.4) - 0.055) * 255);
}

/**
 * Convert RGB to Oklab color space
 * Based on https://bottosson.github.io/posts/oklab/
 * @param {number} r - Red (0-255)
 * @param {number} g - Green (0-255)
 * @param {number} b - Blue (0-255)
 * @returns {object} {L, a, b} in Oklab space
 */
function rgbToOklab(r, g, b) {
  // Convert sRGB to linear RGB
  const lr = srgbToLinear(r);
  const lg = srgbToLinear(g);
  const lb = srgbToLinear(b);

  // Linear RGB to LMS
  const l = 0.4124564 * lr + 0.3575761 * lg + 0.1804375 * lb;
  const m = 0.2126729 * lr + 0.7151522 * lg + 0.0721750 * lb;
  const s = 0.0193339 * lr + 0.1191920 * lg + 0.9503041 * lb;

  // LMS to Oklab
  const l_ = Math.cbrt(l);
  const m_ = Math.cbrt(m);
  const s_ = Math.cbrt(s);

  const L = 0.2104542 * l_ + 0.793618 * m_ - 0.0040720 * s_;
  const a = 1.9779985 * l_ - 2.428592 * m_ + 0.4505937 * s_;
  const b_ = 0.0259040 * l_ + 0.7827717 * m_ - 0.808675 * s_;

  return { L, a, b: b_ };
}

/**
 * Convert Oklab to RGB
 * @param {number} L - Oklab L channel (0-1)
 * @param {number} a - Oklab a channel (-0.4 to 0.4)
 * @param {number} b - Oklab b channel (-0.4 to 0.4)
 * @returns {object} {r, g, b} in sRGB (0-255)
 */
function oklabToRGB(L, a, b) {
  const l_ = L + 0.3963377774 * a + 0.2158037573 * b;
  const m_ = L - 0.1055613458 * a - 0.0638541728 * b;
  const s_ = L - 0.0894841775 * a - 1.2914855480 * b;

  const l = l_ * l_ * l_;
  const m = m_ * m_ * m_;
  const s = s_ * s_ * s_;

  const lr = 4.0767416621 * l - 3.3077363322 * m + 0.2309101289 * s;
  const lg = -1.2684380046 * l + 2.6097574011 * m - 0.3413193761 * s;
  const lb = -0.0041960863 * l - 0.7034186147 * m + 1.7076147010 * s;

  return {
    r: Math.max(0, Math.min(255, linearToSRGB(lr))),
    g: Math.max(0, Math.min(255, linearToSRGB(lg))),
    b: Math.max(0, Math.min(255, linearToSRGB(lb))),
  };
}

/**
 * Extract Oklab channels from ImageData
 * @param {ImageData} imageData - Canvas ImageData
 * @returns {object} {L, a, b} arrays of channel values
 */
function extractOklabChannels(imageData) {
  const data = imageData.data;
  const L = [];
  const a = [];
  const b = [];

  for (let i = 0; i < data.length; i += 4) {
    const oklab = rgbToOklab(data[i], data[i + 1], data[i + 2]);
    L.push(oklab.L);
    a.push(oklab.a);
    b.push(oklab.b);
  }

  return { L, a, b };
}

/**
 * Compute mean and standard deviation
 * @param {number[]} values - Array of numbers
 * @returns {object} {mean, stdDev}
 */
function computeStats(values) {
  if (values.length === 0) {
    return { mean: 0, stdDev: 0 };
  }

  const mean = values.reduce((sum, v) => sum + v, 0) / values.length;
  const variance =
    values.reduce((sum, v) => sum + (v - mean) ** 2, 0) / values.length;
  const stdDev = Math.sqrt(variance);

  return { mean, stdDev };
}

/**
 * Resize ImageData to smaller dimensions
 * Uses nearest-neighbor sampling for speed
 * @param {ImageData} imageData - Source image data
 * @param {number} newWidth - Target width
 * @param {number} newHeight - Target height
 * @returns {ImageData} Resized image data
 */
function resizeImageData(imageData, newWidth, newHeight) {
  const srcWidth = imageData.width;
  const srcHeight = imageData.height;
  const srcData = imageData.data;

  const resized = new ImageData(newWidth, newHeight);
  const dstData = resized.data;

  const xRatio = srcWidth / newWidth;
  const yRatio = srcHeight / newHeight;

  for (let y = 0; y < newHeight; y++) {
    for (let x = 0; x < newWidth; x++) {
      const srcX = Math.floor(x * xRatio);
      const srcY = Math.floor(y * yRatio);
      const srcIdx = (srcY * srcWidth + srcX) * 4;
      const dstIdx = (y * newWidth + x) * 4;

      dstData[dstIdx] = srcData[srcIdx];
      dstData[dstIdx + 1] = srcData[srcIdx + 1];
      dstData[dstIdx + 2] = srcData[srcIdx + 2];
      dstData[dstIdx + 3] = srcData[srcIdx + 3];
    }
  }

  return resized;
}

/**
 * Score using visual style (Oklab multi-scale)
 * Lower score is better (0 = identical)
 * @param {ImageData} source - Source image
 * @param {ImageData} preview - Preview image
 * @returns {number} Score (0-1)
 */
function scoreVisualStyle(source, preview) {
  const scales = [
    { width: source.width, height: source.height },
    { width: Math.max(1, Math.floor(source.width / 2)), height: Math.max(1, Math.floor(source.height / 2)) },
    { width: Math.max(1, Math.floor(source.width / 4)), height: Math.max(1, Math.floor(source.height / 4)) },
  ];

  let totalScore = 0;
  let scaleCount = 0;

  for (const scale of scales) {
    const srcResized = scale.width === source.width && scale.height === source.height
      ? source
      : resizeImageData(source, scale.width, scale.height);

    const prevResized = scale.width === preview.width && scale.height === preview.height
      ? preview
      : resizeImageData(preview, scale.width, scale.height);

    const srcLab = extractOklabChannels(srcResized);
    const prevLab = extractOklabChannels(prevResized);

    // Compute stats for each channel
    const srcLStats = computeStats(srcLab.L);
    const srcAStats = computeStats(srcLab.a);
    const srcBStats = computeStats(srcLab.b);

    const prevLStats = computeStats(prevLab.L);
    const prevAStats = computeStats(prevLab.a);
    const prevBStats = computeStats(prevLab.b);

    // L2 distance in stat space
    const lDist =
      (srcLStats.mean - prevLStats.mean) ** 2 +
      (srcLStats.stdDev - prevLStats.stdDev) ** 2;
    const aDist =
      (srcAStats.mean - prevAStats.mean) ** 2 +
      (srcAStats.stdDev - prevAStats.stdDev) ** 2;
    const bDist =
      (srcBStats.mean - prevBStats.mean) ** 2 +
      (srcBStats.stdDev - prevBStats.stdDev) ** 2;

    // Oklab perception weighting: L is ~79% of perceptual impact
    const scaleScore = Math.sqrt(0.79 * lDist + 0.105 * aDist + 0.105 * bDist);

    totalScore += Math.min(1, scaleScore); // Clamp to 0-1
    scaleCount += 1;
  }

  return totalScore / scaleCount;
}

/**
 * Score using pixel colour (direct per-pixel comparison)
 * Lower score is better (0 = identical)
 * @param {ImageData} source - Source image
 * @param {ImageData} preview - Preview image
 * @returns {number} Score (0-1)
 */
function scorePixelColour(source, preview) {
  const srcData = source.data;
  const prevData = preview.data;

  const minLen = Math.min(srcData.length, prevData.length);
  let totalDist = 0;
  let pixelCount = 0;

  // Compare RGB channels only (skip alpha)
  for (let i = 0; i < minLen; i += 4) {
    const dr = srcData[i] - prevData[i];
    const dg = srcData[i + 1] - prevData[i + 1];
    const db = srcData[i + 2] - prevData[i + 2];

    const dist = Math.sqrt(dr * dr + dg * dg + db * db);
    totalDist += dist;
    pixelCount += 1;
  }

  // Normalize to 0-1 (max distance is ~441 in sRGB)
  return Math.min(1, totalDist / (pixelCount * 441));
}

/**
 * Score preview canvas against source
 * @param {ImageData} source - Source image data
 * @param {ImageData} preview - Preview image data
 * @param {string} objective - 'visual-style' or 'pixel-colour'
 * @returns {number} Score (0-1, lower is better)
 */
function scorePreview(source, preview, objective = 'visual-style') {
  if (!source || !preview) {
    return 1; // Worst score
  }

  if (objective === 'pixel-colour') {
    return scorePixelColour(source, preview);
  }

  return scoreVisualStyle(source, preview);
}

// Export for testing
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    srgbToLinear,
    linearToSRGB,
    rgbToOklab,
    oklabToRGB,
    extractOklabChannels,
    computeStats,
    resizeImageData,
    scoreVisualStyle,
    scorePixelColour,
    scorePreview,
  };
}
