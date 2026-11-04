import { describe, it, expect } from 'vitest';
import {
  hexToRgb,
  rgbToHex,
  getRelativeLuminance,
  getContrastRatio,
  evaluateWcag,
  generateDerivativeShades,
  hexToHsl,
  ACCENT_PRESETS,
} from '../colorContrast';

describe('colorContrast utilities', () => {
  it('correctly converts 3-digit and 6-digit hex to rgb and back', () => {
    expect(hexToRgb('#fff')).toEqual({ r: 255, g: 255, b: 255 });
    expect(hexToRgb('#000000')).toEqual({ r: 0, g: 0, b: 0 });
    expect(hexToRgb('#10b981')).toEqual({ r: 16, g: 185, b: 129 });
    expect(hexToRgb('invalid')).toBeNull();

    expect(rgbToHex({ r: 16, g: 185, b: 129 })).toBe('#10b981');
    expect(rgbToHex({ r: 255, g: 255, b: 255 })).toBe('#ffffff');
  });

  it('calculates relative luminance according to WCAG spec', () => {
    const whiteLum = getRelativeLuminance({ r: 255, g: 255, b: 255 });
    const blackLum = getRelativeLuminance({ r: 0, g: 0, b: 0 });

    expect(whiteLum).toBeCloseTo(1.0, 2);
    expect(blackLum).toBeCloseTo(0.0, 2);
  });

  it('calculates WCAG 2.1 contrast ratio accurately', () => {
    // Pure black on pure white is 21:1
    const maxContrast = getContrastRatio('#ffffff', '#000000');
    expect(maxContrast).toBe(21);

    // Same color has 1:1 ratio
    const minContrast = getContrastRatio('#ffffff', '#ffffff');
    expect(minContrast).toBe(1);

    // Dark background #0a0d14 vs white text #ffffff
    const obsRatio = getContrastRatio('#ffffff', '#0a0d14');
    expect(obsRatio).toBeGreaterThan(16);
  });

  it('evaluates WCAG AA standards correctly', () => {
    // White on pure black easily passes AAA and AA
    const resultAAA = evaluateWcag('#ffffff', '#000000');
    expect(resultAAA.passesAA).toBe(true);
    expect(resultAAA.passesAAA).toBe(true);
    expect(resultAAA.scoreColor).toBe('emerald');

    // Light gray on white fails AA
    const lowContrast = evaluateWcag('#cccccc', '#ffffff');
    expect(lowContrast.passesAA).toBe(false);
    expect(lowContrast.scoreColor).toBe('rose');
  });

  it('generates cohesive derivative shades from a single accent color', () => {
    const shades = generateDerivativeShades('#10b981');
    expect(shades.accent).toBe('#10b981');
    expect(shades.hover).toMatch(/^#[0-9a-f]{6}$/i);
    expect(shades.active).toMatch(/^#[0-9a-f]{6}$/i);
    expect(shades.mutedBg).toContain('rgba(');
    expect(shades.border).toContain('rgba(');
    expect(shades.glow).toContain('rgba(');
  });

  it('converts hex to Tailwind-compatible HSL components', () => {
    const hsl = hexToHsl('#10b981');
    // Emerald 500 is ~158-161 deg hue
    expect(hsl.h).toBeGreaterThanOrEqual(155);
    expect(hsl.h).toBeLessThanOrEqual(165);
    expect(hsl.formatted).toMatch(/^\d+\s+\d+%\s+\d+%$/);
  });

  it('includes 10 distinct UI/UX Pro Max accent presets', () => {
    expect(ACCENT_PRESETS).toHaveLength(10);
    const hexes = new Set(ACCENT_PRESETS.map((p) => p.hex));
    expect(hexes.size).toBe(10);
  });
});

