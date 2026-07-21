import { describe, it, expect } from 'vitest';
import { ColorUtils } from './ColorUtils';
import { ColorGenerator } from '../generator/ColorGenerator';
import type { Color } from '../model/Theme';

describe('ColorUtils', () => {
    it('round-trips RGB -> Oklab -> RGB accurately', () => {
        const rgb: [number, number, number] = [120, 180, 240];
        const oklab = ColorUtils.rgbToOklab(...rgb);
        const restored = ColorUtils.oklabToRgb(...oklab);

        expect(Math.abs(restored[0] - rgb[0])).toBeLessThanOrEqual(2);
        expect(Math.abs(restored[1] - rgb[1])).toBeLessThanOrEqual(2);
        expect(Math.abs(restored[2] - rgb[2])).toBeLessThanOrEqual(2);
    });

    it('sanitizes malformed hex strings gracefully', () => {
        expect(ColorUtils.hexToRgb('#FFF')).toEqual([255, 255, 255]);
        expect(ColorUtils.hexToRgb('#123456')).toEqual([18, 52, 86]);
        expect(ColorUtils.hexToRgb('invalid-hex')).toEqual([0, 0, 0]);
        expect(ColorUtils.hexToRgb('')).toEqual([0, 0, 0]);
    });

    it('calculates WCAG contrast ratio accurately', () => {
        const white: [number, number, number] = [255, 255, 255];
        const black: [number, number, number] = [0, 0, 0];
        const ratio = ColorUtils.getContrastRatio(white, black);
        expect(ratio).toBeCloseTo(21, 0);
    });

    it('performs sRGB gamut clamping for high chroma OKLCH', () => {
        const [L, C, H] = ColorUtils.gamutClampOklch(0.6, 0.45, 120);
        expect(C).toBeLessThan(0.45);
        const hex = ColorUtils.safeOklchToHex(0.6, 0.45, 120);
        expect(hex).toMatch(/^#[0-9A-F]{6}$/);
    });
});

describe('ColorGenerator Scale Monotonicity & WCAG AA', () => {
    it('generates strictly monotonic lightness scales even for dark base colors', () => {
        const darkNavy: Color = ColorUtils.parseColor('#0A192F');
        const colors = ColorGenerator.generateColors(
            darkNavy,
            ColorUtils.parseColor('#64FFDA'),
            ColorUtils.parseColor('#8892B0'),
            'Complementary',
            true
        );

        const stops = [50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950] as const;
        const lightnesses = stops.map(stop => {
            const rgb = ColorUtils.hexToRgb(colors.primaryScale[stop]);
            return ColorUtils.rgbToOklab(rgb[0], rgb[1], rgb[2])[0];
        });

        for (let i = 0; i < lightnesses.length - 1; i++) {
            expect(lightnesses[i]).toBeGreaterThan(lightnesses[i + 1]);
        }
    });

    it('enforces WCAG AA contrast for text roles against surfaces', () => {
        const colors = ColorGenerator.generateColors(
            ColorUtils.parseColor('#35A08C'),
            ColorUtils.parseColor('#CDA660'),
            ColorUtils.parseColor('#1A1D21'),
            'Complementary',
            true
        );

        const textRgb = ColorUtils.hexToRgb(colors.text);
        const surfaceRgb = ColorUtils.hexToRgb(colors.surface);
        const ratio = ColorUtils.getContrastRatio(textRgb, surfaceRgb);

        expect(ratio).toBeGreaterThanOrEqual(4.5);
    });
});
