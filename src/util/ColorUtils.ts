import type { Color } from '../model/Theme';

export class ColorUtils {
    public static parseColor(hex: string): Color {
        const rgb = this.hexToRgb(hex);
        const hsl = this.rgbToHsl(rgb[0], rgb[1], rgb[2]);
        return { hex, rgb, hsl };
    }

    public static hexToHsl(hex: string): [number, number, number] {
        const rgb = this.hexToRgb(hex);
        return this.rgbToHsl(rgb[0], rgb[1], rgb[2]);
    }

    static hexToRgb(hex: string): [number, number, number] {
        let r = 0, g = 0, b = 0;
        if (hex.length === 4) {
            r = parseInt(hex[1] + hex[1], 16);
            g = parseInt(hex[2] + hex[2], 16);
            b = parseInt(hex[3] + hex[3], 16);
        } else if (hex.length === 7) {
            r = parseInt(hex.slice(1, 3), 16);
            g = parseInt(hex.slice(3, 5), 16);
            b = parseInt(hex.slice(5, 7), 16);
        }
        return [r, g, b];
    }

    static rgbToHex(r: number, g: number, b: number): string {
        return "#" + (1 << 24 | r << 16 | g << 8 | b).toString(16).slice(1).toUpperCase();
    }

    static rgbToHsl(r: number, g: number, b: number): [number, number, number] {
        r /= 255; g /= 255; b /= 255;
        const max = Math.max(r, g, b), min = Math.min(r, g, b);
        let h = 0, s = 0, l = (max + min) / 2;

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
        let r, g, b;

        if (s === 0) {
            r = g = b = l;
        } else {
            const hue2rgb = (p: number, q: number, t: number) => {
                if (t < 0) t += 1;
                if (t > 1) t -= 1;
                if (t < 1/6) return p + (q - p) * 6 * t;
                if (t < 1/2) return q;
                if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
                return p;
            };

            const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
            const p = 2 * l - q;
            r = hue2rgb(p, q, h + 1/3);
            g = hue2rgb(p, q, h);
            b = hue2rgb(p, q, h - 1/3);
        }

        return [Math.round(r * 255), Math.round(g * 255), Math.round(b * 255)];
    }

    static hslToHex(h: number, s: number, l: number): string {
        const rgb = this.hslToRgb(h, s, l);
        return this.rgbToHex(rgb[0], rgb[1], rgb[2]);
    }

    static getLuminance(r: number, g: number, b: number): number {
        const a = [r, g, b].map(function (v) {
            v /= 255;
            return v <= 0.03928
                ? v / 12.92
                : Math.pow((v + 0.055) / 1.055, 2.4);
        });
        return a[0] * 0.2126 + a[1] * 0.7152 + a[2] * 0.0722;
    }

    static getContrastRatio(rgb1: [number, number, number], rgb2: [number, number, number]): number {
        const l1 = this.getLuminance(rgb1[0], rgb1[1], rgb1[2]);
        const l2 = this.getLuminance(rgb2[0], rgb2[1], rgb2[2]);
        return (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
    }

    static getAccessibleTextColor(backgroundHex: string): string {
        const rgb = this.hexToRgb(backgroundHex);
        const whiteContrast = this.getContrastRatio(rgb, [255, 255, 255]);
        const blackContrast = this.getContrastRatio(rgb, [30, 41, 59]); // #1E293B
        // Require WCAG AA contrast (4.5:1)
        if (whiteContrast >= 4.5 || whiteContrast > blackContrast) {
            return '#FFFFFF';
        }
        return '#1E293B';
    }

    // --- Oklab Colorspace Methods ---
    static srgbToLinear(val: number): number {
        val /= 255;
        return val >= 0.04045 ? Math.pow((val + 0.055) / 1.055, 2.4) : val / 12.92;
    }

    static linearToSrgb(val: number): number {
        const v = val >= 0.0031308 ? 1.055 * Math.pow(val, 1.0 / 2.4) - 0.055 : 12.92 * val;
        return Math.max(0, Math.min(255, Math.round(v * 255)));
    }

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
}
