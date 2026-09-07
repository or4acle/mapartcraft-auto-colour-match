/**
 * Tests for Scorer Module
 */

const scorer = require('../../src/scorer.js');

describe('Scorer Module', () => {
  describe('srgbToLinear', () => {
    it('should convert 0 to 0', () => {
      expect(scorer.srgbToLinear(0)).toBe(0);
    });

    it('should convert 255 to 1', () => {
      expect(scorer.srgbToLinear(255)).toBeCloseTo(1, 2);
    });

    it('should convert 128 to approximately 0.216', () => {
      expect(scorer.srgbToLinear(128)).toBeCloseTo(0.216, 2);
    });

    it('should handle low values correctly', () => {
      const result = scorer.srgbToLinear(10);
      expect(result).toBeLessThan(0.1);
      expect(result).toBeGreaterThan(0);
    });
  });

  describe('linearToSRGB', () => {
    it('should convert 0 to 0', () => {
      expect(scorer.linearToSRGB(0)).toBe(0);
    });

    it('should convert 1 to 255', () => {
      expect(scorer.linearToSRGB(1)).toBe(255);
    });

    it('should be inverse of srgbToLinear', () => {
      for (let i = 0; i <= 255; i += 10) {
        const linear = scorer.srgbToLinear(i);
        const back = scorer.linearToSRGB(linear);
        expect(back).toBeCloseTo(i, 0);
      }
    });
  });

  describe('rgbToOklab', () => {
    it('should convert pure red', () => {
      const oklab = scorer.rgbToOklab(255, 0, 0);
      expect(oklab.L).toBeGreaterThan(0.4);
      expect(oklab.L).toBeLessThan(0.7);
      expect(oklab.a).toBeGreaterThan(0);
    });

    it('should convert pure green', () => {
      const oklab = scorer.rgbToOklab(0, 255, 0);
      expect(oklab.L).toBeGreaterThan(0.7);
    });

    it('should convert pure blue', () => {
      const oklab = scorer.rgbToOklab(0, 0, 255);
      expect(oklab.L).toBeLessThan(0.5);
      expect(oklab.b).toBeGreaterThan(0);
    });

    it('should convert white to high L', () => {
      const oklab = scorer.rgbToOklab(255, 255, 255);
      expect(oklab.L).toBeCloseTo(1, 1);
      expect(oklab.a).toBeCloseTo(0, 1);
      expect(oklab.b).toBeCloseTo(0, 1);
    });

    it('should convert black to low L', () => {
      const oklab = scorer.rgbToOklab(0, 0, 0);
      expect(oklab.L).toBeCloseTo(0, 1);
      expect(oklab.a).toBeCloseTo(0, 1);
      expect(oklab.b).toBeCloseTo(0, 1);
    });
  });

  describe('oklabToRGB', () => {
    it('should be inverse of rgbToOklab', () => {
      const testColors = [
        [255, 0, 0],
        [0, 255, 0],
        [0, 0, 255],
        [128, 128, 128],
        [255, 255, 0],
        [255, 0, 255],
      ];

      for (const [r, g, b] of testColors) {
        const oklab = scorer.rgbToOklab(r, g, b);
        const rgb = scorer.oklabToRGB(oklab.L, oklab.a, oklab.b);
        expect(rgb.r).toBeCloseTo(r, 0);
        expect(rgb.g).toBeCloseTo(g, 0);
        expect(rgb.b).toBeCloseTo(b, 0);
      }
    });
  });

  describe('computeStats', () => {
    it('should compute mean and stdDev for simple array', () => {
      const values = [1, 2, 3, 4, 5];
      const stats = scorer.computeStats(values);
      expect(stats.mean).toBe(3);
      expect(stats.stdDev).toBeCloseTo(1.414, 2);
    });

    it('should return 0 for empty array', () => {
      const stats = scorer.computeStats([]);
      expect(stats.mean).toBe(0);
      expect(stats.stdDev).toBe(0);
    });

    it('should handle single value', () => {
      const stats = scorer.computeStats([5]);
      expect(stats.mean).toBe(5);
      expect(stats.stdDev).toBe(0);
    });

    it('should handle constant values', () => {
      const stats = scorer.computeStats([7, 7, 7, 7]);
      expect(stats.mean).toBe(7);
      expect(stats.stdDev).toBe(0);
    });
  });

  describe('resizeImageData', () => {
    it('should resize to smaller dimensions', () => {
      const original = new ImageData(100, 100);
      const resized = scorer.resizeImageData(original, 50, 50);
      expect(resized.width).toBe(50);
      expect(resized.height).toBe(50);
      expect(resized.data.length).toBe(50 * 50 * 4);
    });

    it('should preserve data structure', () => {
      const original = new ImageData(10, 10);
      for (let i = 0; i < original.data.length; i += 4) {
        original.data[i] = 100; // R
        original.data[i + 1] = 150; // G
        original.data[i + 2] = 200; // B
        original.data[i + 3] = 255; // A
      }

      const resized = scorer.resizeImageData(original, 5, 5);
      expect(resized.data[0]).toBe(100);
      expect(resized.data[1]).toBe(150);
      expect(resized.data[2]).toBe(200);
      expect(resized.data[3]).toBe(255);
    });
  });

  describe('scorePixelColour', () => {
    it('should return 0 for identical images', () => {
      const img1 = new ImageData(10, 10);
      const img2 = new ImageData(10, 10);

      for (let i = 0; i < img1.data.length; i++) {
        img1.data[i] = img2.data[i] = 128;
      }

      const score = scorer.scorePixelColour(img1, img2);
      expect(score).toBe(0);
    });

    it('should return higher score for different images', () => {
      const img1 = new ImageData(10, 10);
      const img2 = new ImageData(10, 10);

      for (let i = 0; i < img1.data.length; i += 4) {
        img1.data[i] = 0;
        img1.data[i + 1] = 0;
        img1.data[i + 2] = 0;
        img2.data[i] = 255;
        img2.data[i + 1] = 255;
        img2.data[i + 2] = 255;
      }

      const score = scorer.scorePixelColour(img1, img2);
      expect(score).toBeGreaterThan(0.5);
      expect(score).toBeLessThanOrEqual(1);
    });

    it('should be between 0 and 1', () => {
      const img1 = new ImageData(20, 20);
      const img2 = new ImageData(20, 20);

      for (let i = 0; i < img1.data.length; i += 4) {
        img1.data[i] = Math.random() * 255;
        img2.data[i] = Math.random() * 255;
      }

      const score = scorer.scorePixelColour(img1, img2);
      expect(score).toBeGreaterThanOrEqual(0);
      expect(score).toBeLessThanOrEqual(1);
    });
  });

  describe('scoreVisualStyle', () => {
    it('should return 0 for identical images', () => {
      const img1 = new ImageData(64, 64);
      const img2 = new ImageData(64, 64);

      for (let i = 0; i < img1.data.length; i++) {
        img1.data[i] = img2.data[i] = 128;
      }

      const score = scorer.scoreVisualStyle(img1, img2);
      expect(score).toBeCloseTo(0, 1);
    });

    it('should return value between 0 and 1', () => {
      const img1 = new ImageData(64, 64);
      const img2 = new ImageData(64, 64);

      for (let i = 0; i < img1.data.length; i += 4) {
        img1.data[i] = Math.random() * 255;
        img2.data[i] = Math.random() * 255;
      }

      const score = scorer.scoreVisualStyle(img1, img2);
      expect(score).toBeGreaterThanOrEqual(0);
      expect(score).toBeLessThanOrEqual(1);
    });

    it('should detect differences in luminance', () => {
      const img1 = new ImageData(64, 64);
      const img2 = new ImageData(64, 64);

      // Fill img1 with medium gray
      for (let i = 0; i < img1.data.length; i += 4) {
        img1.data[i] = 128;
        img1.data[i + 1] = 128;
        img1.data[i + 2] = 128;
      }

      // Fill img2 with bright white
      for (let i = 0; i < img2.data.length; i += 4) {
        img2.data[i] = 255;
        img2.data[i + 1] = 255;
        img2.data[i + 2] = 255;
      }

      const score = scorer.scoreVisualStyle(img1, img2);
      expect(score).toBeGreaterThan(0);
    });
  });

  describe('scorePreview', () => {
    it('should use visual style by default', () => {
      const img1 = new ImageData(64, 64);
      const img2 = new ImageData(64, 64);

      for (let i = 0; i < img1.data.length; i++) {
        img1.data[i] = img2.data[i] = 128;
      }

      const score = scorer.scorePreview(img1, img2);
      expect(score).toBeCloseTo(0, 1);
    });

    it('should use pixel-colour when specified', () => {
      const img1 = new ImageData(64, 64);
      const img2 = new ImageData(64, 64);

      for (let i = 0; i < img1.data.length; i++) {
        img1.data[i] = img2.data[i] = 128;
      }

      const score = scorer.scorePreview(img1, img2, 'pixel-colour');
      expect(score).toBe(0);
    });

    it('should return worst score for null input', () => {
      const img = new ImageData(64, 64);
      expect(scorer.scorePreview(null, img)).toBe(1);
      expect(scorer.scorePreview(img, null)).toBe(1);
      expect(scorer.scorePreview(null, null)).toBe(1);
    });
  });
});
