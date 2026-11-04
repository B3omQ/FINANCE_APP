/**
 * Color and WCAG 2.1 Contrast Utilities
 * Based on W3C Relative Luminance & Contrast Ratio Specification
 */

export interface RgbColor {
  r: number;
  g: number;
  b: number;
}

export interface WcagEvaluation {
  ratio: number;
  ratioFormatted: string;
  passesAA: boolean;
  passesAALarge: boolean;
  passesAAA: boolean;
  scoreLabel: "Kém" | "Đạt chuẩn AA" | "Xuất sắc (AAA)";
  scoreColor: "rose" | "amber" | "emerald";
}

/**
 * Parses a hex color string (#rgb, #rrggbb) into { r, g, b }.
 */
export function hexToRgb(hex: string): RgbColor | null {
  const clean = hex.replace(/^#/, "").trim();
  if (clean.length === 3) {
    const c0 = clean.charAt(0);
    const c1 = clean.charAt(1);
    const c2 = clean.charAt(2);
    const r = parseInt(c0 + c0, 16);
    const g = parseInt(c1 + c1, 16);
    const b = parseInt(c2 + c2, 16);
    return isNaN(r) || isNaN(g) || isNaN(b) ? null : { r, g, b };
  }
  if (clean.length === 6) {
    const r = parseInt(clean.slice(0, 2), 16);
    const g = parseInt(clean.slice(2, 4), 16);
    const b = parseInt(clean.slice(4, 6), 16);
    return isNaN(r) || isNaN(g) || isNaN(b) ? null : { r, g, b };
  }
  return null;
}

export function rgbToHex({ r, g, b }: RgbColor): string {
  const toHex = (n: number) => Math.max(0, Math.min(255, Math.round(n))).toString(16).padStart(2, "0");
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

/**
 * Converts a hex color to HSL values and returns Tailwind-ready space-separated string: "h s% l%"
 */
export function hexToHsl(hex: string): { h: number; s: number; l: number; formatted: string } {
  const rgb = hexToRgb(hex) ?? { r: 16, g: 185, b: 129 };
  const r = rgb.r / 255;
  const g = rgb.g / 255;
  const b = rgb.b / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r:
        h = (g - b) / d + (g < b ? 6 : 0);
        break;
      case g:
        h = (b - r) / d + 2;
        break;
      case b:
        h = (r - g) / d + 4;
        break;
    }
    h /= 6;
  }

  const hDeg = Math.round(h * 360);
  const sPct = Math.round(s * 100);
  const lPct = Math.round(l * 100);

  return {
    h: hDeg,
    s: sPct,
    l: lPct,
    formatted: `${hDeg} ${sPct}% ${lPct}%`,
  };
}

/**
 * Calculates relative luminance for WCAG contrast.
 * Formula: https://www.w3.org/WAI/GL/wiki/Relative_luminance
 */
export function getRelativeLuminance(rgb: RgbColor): number {
  const transform = (c: number) => {
    const sc = c / 255;
    return sc <= 0.04045 ? sc / 12.92 : Math.pow((sc + 0.055) / 1.055, 2.4);
  };
  const rLin = transform(rgb.r);
  const gLin = transform(rgb.g);
  const bLin = transform(rgb.b);
  return 0.2126 * rLin + 0.7152 * gLin + 0.0722 * bLin;
}

/**
 * Calculates WCAG 2.1 Contrast Ratio between two hex colors.
 * Formula: (L1 + 0.05) / (L2 + 0.05) where L1 is lighter.
 */
export function getContrastRatio(hex1: string, hex2: string): number {
  const rgb1 = hexToRgb(hex1) ?? { r: 255, g: 255, b: 255 };
  const rgb2 = hexToRgb(hex2) ?? { r: 0, g: 0, b: 0 };

  const l1 = getRelativeLuminance(rgb1);
  const l2 = getRelativeLuminance(rgb2);

  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);

  const ratio = (lighter + 0.05) / (darker + 0.05);
  return Math.round(ratio * 100) / 100;
}

/**
 * Evaluates contrast ratio against WCAG AA & AAA standards.
 * AA standard: min 4.5:1 for normal body text, min 3.0:1 for large/bold text.
 * AAA standard: min 7.0:1.
 */
export function evaluateWcag(textColor: string, bgColor: string): WcagEvaluation {
  const ratio = getContrastRatio(textColor, bgColor);
  const passesAA = ratio >= 4.5;
  const passesAALarge = ratio >= 3.0;
  const passesAAA = ratio >= 7.0;

  let scoreLabel: WcagEvaluation["scoreLabel"] = "Kém";
  let scoreColor: WcagEvaluation["scoreColor"] = "rose";

  if (passesAAA) {
    scoreLabel = "Xuất sắc (AAA)";
    scoreColor = "emerald";
  } else if (passesAA) {
    scoreLabel = "Đạt chuẩn AA";
    scoreColor = "emerald";
  } else if (passesAALarge) {
    scoreLabel = "Đạt chuẩn AA";
    scoreColor = "amber";
  }

  return {
    ratio,
    ratioFormatted: `${ratio.toFixed(1)}:1`,
    passesAA,
    passesAALarge,
    passesAAA,
    scoreLabel,
    scoreColor,
  };
}

/**
 * Generates derivative shades (hover, border, soft background, glow) from a single accent color.
 */
export function generateDerivativeShades(accentHex: string) {
  const rgb = hexToRgb(accentHex) ?? { r: 16, g: 185, b: 129 };

  // Hover: slightly brighter/richer
  const hoverRgb = {
    r: Math.min(255, rgb.r * 1.1 + 10),
    g: Math.min(255, rgb.g * 1.1 + 10),
    b: Math.min(255, rgb.b * 1.1 + 10),
  };

  // Active: slightly darker
  const activeRgb = {
    r: Math.max(0, rgb.r * 0.88),
    g: Math.max(0, rgb.g * 0.88),
    b: Math.max(0, rgb.b * 0.88),
  };

  return {
    accent: accentHex,
    hover: rgbToHex(hoverRgb),
    active: rgbToHex(activeRgb),
    mutedBg: `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.12)`,
    border: `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.28)`,
    glow: `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.25)`,
  };
}

/**
 * Curated color presets from UI/UX Pro Max library.
 */
export const ACCENT_PRESETS: { name: string; hex: string; desc: string }[] = [
  { name: "Emerald Mint", hex: "#10b981", desc: "Tài chính, sinh sôi, bền vững" },
  { name: "Vivid Teal", hex: "#0d9488", desc: "Tập trung, điềm tĩnh, công nghệ" },
  { name: "Sapphire Blue", hex: "#2563eb", desc: "Tin cậy, chuẩn mực ngân hàng" },
  { name: "Electric Indigo", hex: "#6366f1", desc: "Hiện đại, thanh lịch, tinh xảo" },
  { name: "Amethyst Purple", hex: "#8b5cf6", desc: "Sang trọng, tương lai, quyền năng" },
  { name: "Amber Gold", hex: "#f59e0b", desc: "Vàng kim, thịnh vượng, giá trị" },
  { name: "Rose Coral", hex: "#f43f5e", desc: "Năng động, đam mê, nổi bật" },
  { name: "Ruby Crimson", hex: "#e11d48", desc: "Mạnh mẽ, dứt khoát, cao cấp" },
  { name: "Cyan Ice", hex: "#06b6d4", desc: "Trong trẻo, tươi mới, thanh thoát" },
  { name: "Obsidian Titanium", hex: "#94a3b8", desc: "Tối giản, chuyên nghiệp, sắc gọn" },
];
