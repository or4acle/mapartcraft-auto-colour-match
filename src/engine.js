/**
 * Engine Module - Candidate generation and evaluation loop
 */

const SEARCH_MODES = {
  fast: {
    brightnessSteps: 5,
    contrastSteps: 5,
    saturationSteps: 3,
    ditheringOptions: ['ordered', 'diffusion'],
  },
  balanced: {
    brightnessSteps: 7,
    contrastSteps: 7,
    saturationSteps: 5,
    ditheringOptions: ['ordered', 'diffusion', 'noise'],
  },
  deep: {
    brightnessSteps: 11,
    contrastSteps: 11,
    saturationSteps: 7,
    ditheringOptions: ['ordered', 'diffusion', 'noise'],
  },
};

const BRIGHTNESS_RANGE = { min: -100, max: 100 };
const CONTRAST_RANGE = { min: -100, max: 100 };
const SATURATION_RANGE = { min: -100, max: 100 };

/**
 * Generate candidates for search
 * @param {string} mode - 'fast', 'balanced', or 'deep'
 * @param {boolean} optimizeDithering - Include dithering in optimization
 * @returns {object[]} Array of candidates {brightness, contrast, saturation, dithering}
 */
function generateCandidates(mode = 'balanced', optimizeDithering = false) {
  const config = SEARCH_MODES[mode] || SEARCH_MODES.balanced;
  const candidates = [];

  const brightnessStep = (BRIGHTNESS_RANGE.max - BRIGHTNESS_RANGE.min) / (config.brightnessSteps - 1);
  const contrastStep = (CONTRAST_RANGE.max - CONTRAST_RANGE.min) / (config.contrastSteps - 1);
  const saturationStep = (SATURATION_RANGE.max - SATURATION_RANGE.min) / (config.saturationSteps - 1);

  const ditherOptions = optimizeDithering ? config.ditheringOptions : [null];

  for (let i = 0; i < config.brightnessSteps; i++) {
    const brightness = Math.round(BRIGHTNESS_RANGE.min + i * brightnessStep);

    for (let j = 0; j < config.contrastSteps; j++) {
      const contrast = Math.round(CONTRAST_RANGE.min + j * contrastStep);

      for (let k = 0; k < config.saturationSteps; k++) {
        const saturation = Math.round(SATURATION_RANGE.min + k * saturationStep);

        for (const dithering of ditherOptions) {
          candidates.push({
            brightness,
            contrast,
            saturation,
            dithering,
          });
        }
      }
    }
  }

  return candidates;
}

/**
 * Create cache key from canvas and settings
 * @param {string} canvasHash - Canvas hash
 * @param {number} width - Canvas width
 * @param {number} height - Canvas height
 * @returns {string} Cache key
 */
function getCacheKey(canvasHash, width, height) {
  return `${canvasHash}_${width}x${height}`;
}

/**
 * Engine state and management
 */
class OptimizationEngine {
  constructor() {
    this.isRunning = false;
    this.candidates = [];
    this.currentIndex = 0;
    this.bestResult = null;
    this.resultCache = {}; // key -> {score, result}
    this.timings = []; // Track timing for adaptive timeouts
    this.attempts = 0;
  }

  /**
   * Initialize engine for optimization run
   * @param {string} mode - 'fast', 'balanced', 'deep'
   * @param {boolean} optimizeDithering - Include dithering
   */
  initialize(mode, optimizeDithering) {
    this.candidates = generateCandidates(mode, optimizeDithering);
    this.currentIndex = 0;
    this.bestResult = {
      brightness: 0,
      contrast: 0,
      saturation: 0,
      dithering: null,
      score: 1, // Worst score
    };
    this.attempts = 0;
    this.isRunning = false;
  }

  /**
   * Get next candidate to evaluate
   * @returns {object|null} Candidate or null if done
   */
  getNextCandidate() {
    if (this.currentIndex >= this.candidates.length) {
      return null;
    }
    return this.candidates[this.currentIndex];
  }

  /**
   * Record attempt timing for adaptive timeouts
   * @param {number} duration - Execution duration in ms
   */
  recordTiming(duration) {
    this.timings.push(duration);
    if (this.timings.length > 100) {
      this.timings.shift(); // Keep last 100 timings
    }
  }

  /**
   * Get adaptive timeout based on recent timings
   * @returns {number} Timeout in ms
   */
  getAdaptiveTimeout() {
    if (this.timings.length === 0) {
      return 500; // Default
    }

    const avgTiming = this.timings.reduce((a, b) => a + b, 0) / this.timings.length;
    return Math.max(200, Math.min(3000, avgTiming * 2));
  }

  /**
   * Update best result if current score is better
   * @param {object} candidate - Current candidate
   * @param {number} score - Score result
   * @returns {boolean} True if updated
   */
  updateBestResult(candidate, score) {
    if (score < this.bestResult.score) {
      this.bestResult = {
        brightness: candidate.brightness,
        contrast: candidate.contrast,
        saturation: candidate.saturation,
        dithering: candidate.dithering,
        score,
      };
      return true;
    }
    return false;
  }

  /**
   * Move to next candidate
   */
  advanceToNext() {
    this.currentIndex += 1;
    this.attempts += 1;
  }

  /**
   * Get progress percentage
   * @returns {number} Progress 0-100
   */
  getProgress() {
    return Math.round((this.currentIndex / this.candidates.length) * 100);
  }

  /**
   * Check if optimization is complete
   * @returns {boolean} True if all candidates evaluated
   */
  isComplete() {
    return this.currentIndex >= this.candidates.length;
  }

  /**
   * Stop optimization
   */
  stop() {
    this.isRunning = false;
  }

  /**
   * Get current state summary
   * @returns {object} State summary
   */
  getState() {
    return {
      isRunning: this.isRunning,
      progress: this.getProgress(),
      attempts: this.attempts,
      bestResult: { ...this.bestResult },
      totalCandidates: this.candidates.length,
      isComplete: this.isComplete(),
    };
  }
}

// Export for use
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    generateCandidates,
    getCacheKey,
    OptimizationEngine,
    SEARCH_MODES,
  };
}
