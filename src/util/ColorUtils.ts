import type { Color } from '../model/Theme';

/**
 * Comprehensive color utility module.
 *
 * Supports RGB, HSL, Oklab, and OKLCH color spaces.
 * Includes gamut clamping, WCAG contrast, color harmony helpers,
 * and a seeded PRNG for deterministic clustering.
 */
export class ColorUtils {

    // ─── Construction ────────────────────────────────────────

    public static parseColor(hex: string): Color {
        const rgb = this.hexToRgb(hex);
        const hsl = this.rgbToHsl(rgb[0], rgb[1], rgb[2]);
        return { hex, rgb, hsl };
    }

    public static createColor(rgb: [number, number, number]): Color {
        return {
            rgb,
            hex: this.rgbToHex(rgb[0], rgb[1], rgb[2]),
            hsl: this.rgbToHsl(rgb[0], rgb[1], rgb[2]),
        };
    }

    // ─── HEX ←→ RGB ─────────────────────────────────────────

    static hexToRgb(hex: string): [number, number, number] {
        if (!hex || typeof hex !== 'string') return [0, 0, 0];
        const cleaned = hex.trim().replace(/^#/, '');
        if (!/^(?:[0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/.test(cleaned)) {
            return [0, 0, 0];
        }
        let r = 0, g = 0, b = 0;
        if (cleaned.length === 3) {
            r = parseInt(cleaned[0] + cleaned[0], 16) || 0;
            g = parseInt(cleaned[1] + cleaned[1], 16) || 0;
            b = parseInt(cleaned[2] + cleaned[2], 16) || 0;
        } else if (cleaned.length === 6) {
            r = parseInt(cleaned.slice(0, 2), 16) || 0;
            g = parseInt(cleaned.slice(2, 4), 16) || 0;
            b = parseInt(cleaned.slice(4, 6), 16) || 0;
        }
        return [r, g, b];
    }

    static rgbToHex(r: number, g: number, b: number): string {
        const clamp = (v: number) => Math.max(0, Math.min(255, Math.round(v)));
        return '#' + (1 << 24 | clamp(r) << 16 | clamp(g) << 8 | clamp(b))
            .toString(16).slice(1).toUpperCase();
    }

    // ─── RGB ←→ HSL ──────────────────────────────────────────

    static rgbToHsl(r: number, g: number, b: number): [number, number, number] {
        r /= 255; g /= 255; b /= 255;
        const max = Math.max(r, g, b), min = Math.min(r, g, b);
        let h = 0, s = 0;
        const l = (max + min) / 2;

        if (max !== min) {
            const d = max - min;
            s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
            switch (max) {
                case r: h = (g - b) / d + (g < b ? 6 : 0); break;
                case g: h = (b - r) / d + 2; break;
                case b: h = (r - g) / d + 4; break;
            }
            h /= 6;
        }

        return [Math.round(h * 360), Math.round(s * 100), Math.round(l * 100)];
    }

    static hslToRgb(h: number, s: number, l: number): [number, number, number] {
        h /= 360; s /= 100; l /= 100;
        let r: number, g: number, b: number;

        if (s === 0) {
            r = g = b = l;
        } else {
            const hue2rgb = (p: number, q: number, t: number) => {
                if (t < 0) t += 1;
                if (t > 1) t -= 1;
                if (t < 1 / 6) return p + (q - p) * 6 * t;
                if (t < 1 / 2) return q;
                if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
                return p;
            };
            const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
            const p = 2 * l - q;
            r = hue2rgb(p, q, h + 1 / 3);
            g = hue2rgb(p, q, h);
            b = hue2rgb(p, q, h - 1 / 3);
        }

        return [Math.round(r * 255), Math.round(g * 255), Math.round(b * 255)];
    }

    public static hexToHsl(hex: string): [number, number, number] {
        const rgb = this.hexToRgb(hex);
        return this.rgbToHsl(rgb[0], rgb[1], rgb[2]);
    }

    static hslToHex(h: number, s: number, l: number): string {
        const rgb = this.hslToRgb(h, s, l);
        return this.rgbToHex(rgb[0], rgb[1], rgb[2]);
    }

    // ─── sRGB ←→ Linear ─────────────────────────────────────

    static srgbToLinear(val: number): number {
        val /= 255;
        return val >= 0.04045 ? Math.pow((val + 0.055) / 1.055, 2.4) : val / 12.92;
    }

    static linearToSrgb(val: number): number {
        const v = val >= 0.0031308
            ? 1.055 * Math.pow(val, 1.0 / 2.4) - 0.055
            : 12.92 * val;
        return Math.max(0, Math.min(255, Math.round(v * 255)));
    }

    // ─── RGB ←→ Oklab ────────────────────────────────────────

    static rgbToOklab(r: number, g: number, b: number): [number, number, number] {
        const lr = this.srgbToLinear(r);
        const lg = this.srgbToLinear(g);
        const lb = this.srgbToLinear(b);

        const l = 0.4122214708 * lr + 0.5363325363 * lg + 0.0514459929 * lb;
        const m = 0.2119034982 * lr + 0.6806995451 * lg + 0.1073969566 * lb;
        const s = 0.0883024619 * lr + 0.2817188376 * lg + 0.6299787005 * lb;

        const l_ = Math.cbrt(l);
        const m_ = Math.cbrt(m);
        const s_ = Math.cbrt(s);

        return [
            0.2104542553 * l_ + 0.7936177850 * m_ - 0.0040720468 * s_,
            1.9779984951 * l_ - 2.4285922050 * m_ + 0.4505937099 * s_,
            0.0259040371 * l_ + 0.7827717662 * m_ - 0.8086757660 * s_,
        ];
    }

    static oklabToRgb(L: number, a: number, b: number): [number, number, number] {
        const l_ = L + 0.3963377774 * a + 0.2158037573 * b;
        const m_ = L - 0.1055613458 * a - 0.0638541728 * b;
        const s_ = L - 0.0894841775 * a - 1.2914855480 * b;

        const l = l_ * l_ * l_;
        const m = m_ * m_ * m_;
        const s = s_ * s_ * s_;

        const lr = 4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s;
        const lg = -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s;
        const lb = -0.0041960863 * l - 0.7034186147 * m + 1.7076147010 * s;

        return [this.linearToSrgb(lr), this.linearToSrgb(lg), this.linearToSrgb(lb)];
    }

    static oklabToHex(L: number, a: number, b: number): string {
        const rgb = this.oklabToRgb(L, a, b);
        return this.rgbToHex(rgb[0], rgb[1], rgb[2]);
    }

    // ─── RGB ←→ OKLCH (cylindrical Oklab) ────────────────────

    static rgbToOklch(r: number, g: number, b: number): [number, number, number] {
        const [L, a, bVal] = this.rgbToOklab(r, g, b);
        const C = Math.sqrt(a * a + bVal * bVal);
        let H = Math.atan2(bVal, a) * (180 / Math.PI);
        if (H < 0) H += 360;
        return [L, C, H];
    }

    static oklchToRgb(L: number, C: number, H: number): [number, number, number] {
        const hRad = H * (Math.PI / 180);
        const a = C * Math.cos(hRad);
        const b = C * Math.sin(hRad);
        return this.oklabToRgb(L, a, b);
    }

    static oklchToHex(L: number, C: number, H: number): string {
        const rgb = this.oklchToRgb(L, C, H);
        return this.rgbToHex(rgb[0], rgb[1], rgb[2]);
    }

    // ─── Gamut Clamping ──────────────────────────────────────
    /**
     * Clamp an OKLCH color into the sRGB gamut by reducing chroma
     * while preserving hue and lightness. Uses binary search for accuracy.
     */
    static gamutClampOklch(L: number, C: number, H: number): [number, number, number] {
        // Clamp lightness to valid range
        L = Math.max(0, Math.min(1, L));

        if (C <= 0) return [L, 0, H];

        // Check if already in gamut
        if (this.isInSrgbGamut(L, C, H)) return [L, C, H];

        // Binary search to find max in-gamut chroma
        let lo = 0;
        let hi = C;
        for (let i = 0; i < 20; i++) {
            const mid = (lo + hi) / 2;
            if (this.isInSrgbGamut(L, mid, H)) {
                lo = mid;
            } else {
                hi = mid;
            }
        }

        return [L, lo, H];
    }

    private static isInSrgbGamut(L: number, C: number, H: number): boolean {
        const hRad = H * (Math.PI / 180);
        const a = C * Math.cos(hRad);
        const b = C * Math.sin(hRad);

        const l_ = L + 0.3963377774 * a + 0.2158037573 * b;
        const m_ = L - 0.1055613458 * a - 0.0638541728 * b;
        const s_ = L - 0.0894841775 * a - 1.2914855480 * b;

        const l = l_ * l_ * l_;
        const m = m_ * m_ * m_;
        const s = s_ * s_ * s_;

        const lr = 4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s;
        const lg = -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s;
        const lb = -0.0041960863 * l - 0.7034186147 * m + 1.7076147010 * s;

        const eps = 0.001;
        return lr >= -eps && lr <= 1 + eps &&
               lg >= -eps && lg <= 1 + eps &&
               lb >= -eps && lb <= 1 + eps;
    }

    /**
     * Create a gamut-safe hex color from OKLCH values.
     */
    static safeOklchToHex(L: number, C: number, H: number): string {
        const [clL, clC, clH] = this.gamutClampOklch(L, C, H);
        return this.oklchToHex(clL, clC, clH);
    }

    // ─── Color Harmony (OKLCH hue rotation) ──────────────────

    /**
     * Rotate hue of an RGB color by the specified degrees in OKLCH space.
     * Returns a gamut-clamped RGB result.
     */
    static rotateHue(rgb: [number, number, number], degrees: number): [number, number, number] {
        const [L, C, H] = this.rgbToOklch(rgb[0], rgb[1], rgb[2]);
        const newH = ((H + degrees) % 360 + 360) % 360;
        const [clL, clC, clH] = this.gamutClampOklch(L, C, newH);
        return this.oklchToRgb(clL, clC, clH);
    }

    /**
     * Get harmony colors for a base RGB color.
     */
    static getHarmonyColors(
        baseRgb: [number, number, number],
        harmony: 'Complementary' | 'Analogous' | 'Triadic' | 'Split-Complementary'
    ): [number, number, number][] {
        switch (harmony) {
            case 'Complementary':
                return [this.rotateHue(baseRgb, 180)];
            case 'Analogous':
                return [this.rotateHue(baseRgb, 30), this.rotateHue(baseRgb, -30)];
            case 'Triadic':
                return [this.rotateHue(baseRgb, 120), this.rotateHue(baseRgb, 240)];
            case 'Split-Complementary':
                return [this.rotateHue(baseRgb, 150), this.rotateHue(baseRgb, 210)];
        }
    }

    // ─── WCAG Contrast ───────────────────────────────────────

    static getLuminance(r: number, g: number, b: number): number {
        const a = [r, g, b].map(v => {
            v /= 255;
            return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
        });
        return a[0] * 0.2126 + a[1] * 0.7152 + a[2] * 0.0722;
    }

    static getContrastRatio(
        rgb1: [number, number, number],
        rgb2: [number, number, number]
    ): number {
        const l1 = this.getLuminance(rgb1[0], rgb1[1], rgb1[2]);
        const l2 = this.getLuminance(rgb2[0], rgb2[1], rgb2[2]);
        return (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
    }

    static getWcagLevel(contrast: number): 'AAA' | 'AA' | 'Fail' {
        if (contrast >= 7) return 'AAA';
        if (contrast >= 4.5) return 'AA';
        return 'Fail';
    }

    static getAccessibleTextColor(backgroundHex: string, darkTextHex: string = '#1E293B'): string {
        const rgb = this.hexToRgb(backgroundHex);
        const darkRgb = this.hexToRgb(darkTextHex);
        const whiteContrast = this.getContrastRatio(rgb, [255, 255, 255]);
        const darkContrast = this.getContrastRatio(rgb, darkRgb);
        // Prefer whichever meets WCAG AA, biased toward white for dark themes
        if (whiteContrast >= 4.5) return '#FFFFFF';
        if (darkContrast >= 4.5) return darkTextHex;
        // Neither meets AA, pick the higher contrast
        return whiteContrast > darkContrast ? '#FFFFFF' : darkTextHex;
    }

    // ─── Seeded PRNG (for deterministic K-Means++) ───────────
    /**
     * Simple Mulberry32 PRNG. Returns a function that yields [0, 1) on each call.
     */
    static createSeededRng(seed: number): () => number {
        let state = seed | 0;
        return () => {
            state = (state + 0x6D2B79F5) | 0;
            let t = Math.imul(state ^ (state >>> 15), 1 | state);
            t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
            return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
        };
    }

    // ─── Oklab Distance (for clustering) ─────────────────────

    /**
     * Squared Euclidean distance between two Oklab colors.
     */
    static oklabDistanceSq(
        a: [number, number, number],
        b: [number, number, number]
    ): number {
        const dL = a[0] - b[0];
        const da = a[1] - b[1];
        const db = a[2] - b[2];
        return dL * dL + da * da + db * db;
    }
}
