import { ColorUtils } from '../util/ColorUtils';
import type { ColorScale, Color, ThemeColors, ColorHarmony } from '../model/Theme';

/**
 * Generates complete design system color tokens from extracted base colors.
 *
 * Inspired by:
 *  - Adobe Leonardo's contrast-ratio-first approach
 *  - Atmos's OKLCH shade generation
 *  - Tailwind's 50-950 scale convention
 *
 * All palette generation is done in Oklab/OKLCH perceptual color space
 * with sRGB gamut clamping to ensure displayable colors.
 */
export class ColorGenerator {

    // ─── Oklab Lightness Stops ────────────────────────────────
    // Maps to the standard 50–950 design-token scale.
    // Values are Oklab L (0 = black, 1 = white).
    private static readonly LIGHT_STEPS = [
        { level: 50,  L: 0.97 },
        { level: 100, L: 0.93 },
        { level: 200, L: 0.86 },
        { level: 300, L: 0.77 },
        { level: 400, L: 0.68 },
        { level: 500, L: 0.57 },  // Placeholder — overridden by actual color
        { level: 600, L: 0.48 },
        { level: 700, L: 0.39 },
        { level: 800, L: 0.31 },
        { level: 900, L: 0.24 },
        { level: 950, L: 0.16 },
    ];

    // ─── Scale Generation ────────────────────────────────────

    private static generateScale(baseColor: Color): ColorScale {
        const oklab = ColorUtils.rgbToOklab(baseColor.rgb[0], baseColor.rgb[1], baseColor.rgb[2]);
        const oklch = ColorUtils.rgbToOklch(baseColor.rgb[0], baseColor.rgb[1], baseColor.rgb[2]);
        const baseChroma = oklch[1];
        const baseHue = oklch[2];
        const baseL = Math.max(0.12, Math.min(0.98, oklab[0]));

        // Find closest lightness step in LIGHT_STEPS to baseL
        let closestIndex = 5; // Default 500
        let minDiff = Infinity;
        for (let i = 0; i < this.LIGHT_STEPS.length; i++) {
            const diff = Math.abs(this.LIGHT_STEPS[i].L - baseL);
            if (diff < minDiff) {
                minDiff = diff;
                closestIndex = i;
            }
        }

        // Interpolate lightness values maintaining strict monotonicity L[i] > L[i+1]
        const targetL = new Array<number>(this.LIGHT_STEPS.length);
        targetL[closestIndex] = baseL;
        const maxL = 0.97;
        const minL = 0.16;

        for (let i = closestIndex - 1; i >= 0; i--) {
            const rangeFrac = (closestIndex - i) / (closestIndex + 1);
            targetL[i] = baseL + (maxL - baseL) * rangeFrac;
        }

        for (let i = closestIndex + 1; i < this.LIGHT_STEPS.length; i++) {
            const rangeFrac = (i - closestIndex) / (this.LIGHT_STEPS.length - 1 - closestIndex);
            targetL[i] = baseL - (baseL - minL) * rangeFrac;
        }

        const scale: Record<number, string> = {};

        for (let i = 0; i < this.LIGHT_STEPS.length; i++) {
            const step = this.LIGHT_STEPS[i];
            const level = step.level;

            if (i === closestIndex) {
                scale[level] = baseColor.hex;
                continue;
            }

            const L = targetL[i];
            let chromaMultiplier = 1.0;
            if (level <= 100) chromaMultiplier = 0.45;
            else if (level <= 200) chromaMultiplier = 0.65;
            else if (level >= 900) chromaMultiplier = 0.7;
            else if (level >= 800) chromaMultiplier = 0.8;

            const C = baseChroma * chromaMultiplier;
            scale[level] = ColorUtils.safeOklchToHex(L, C, baseHue);
        }

        return scale as unknown as ColorScale;
    }

    /**
     * Binary search OKLCH lightness to guarantee minimum WCAG contrast against surface.
     */
    public static enforceContrast(
        textHex: string,
        bgHex: string,
        minContrast: number = 4.5
    ): string {
        const bgRgb = ColorUtils.hexToRgb(bgHex);
        let textRgb = ColorUtils.hexToRgb(textHex);
        let currentRatio = ColorUtils.getContrastRatio(textRgb, bgRgb);

        if (currentRatio >= minContrast) return textHex;

        const [L, C, H] = ColorUtils.rgbToOklch(textRgb[0], textRgb[1], textRgb[2]);
        const bgL = ColorUtils.rgbToOklab(bgRgb[0], bgRgb[1], bgRgb[2])[0];
        const adjustLighter = bgL < 0.5;

        let lo = L;
        let hi = adjustLighter ? 0.98 : 0.16;
        let bestHex = textHex;

        for (let i = 0; i < 15; i++) {
            const mid = (lo + hi) / 2;
            const candidateHex = ColorUtils.safeOklchToHex(mid, C, H);
            const candidateRgb = ColorUtils.hexToRgb(candidateHex);
            const ratio = ColorUtils.getContrastRatio(candidateRgb, bgRgb);

            if (ratio >= minContrast) {
                bestHex = candidateHex;
                if (adjustLighter) hi = mid; else lo = mid;
            } else {
                if (adjustLighter) lo = mid; else hi = mid;
            }
        }

        return bestHex;
    }

    // ─── Full Palette Generation ─────────────────────────────

    public static generateColors(
        primary: Color,
        secondary: Color,
        neutral: Color,
        harmony: ColorHarmony = 'Complementary',
        isDarkMode: boolean = false,
    ): ThemeColors {
        const primaryScale = this.generateScale(primary);
        const secondaryScale = this.generateScale(secondary);

        const accentRgb = ColorUtils.getHarmonyColors(primary.rgb, harmony)[0];
        const accent = ColorUtils.createColor(accentRgb);
        const accentScale = this.generateScale(accent);

        const primaryOklch = ColorUtils.rgbToOklch(primary.rgb[0], primary.rgb[1], primary.rgb[2]);
        const neutralOklab = ColorUtils.rgbToOklab(neutral.rgb[0], neutral.rgb[1], neutral.rgb[2]);
        const brandedNeutralChroma = Math.max(0.005, Math.min(0.02, primaryOklch[1] * 0.15));
        const brandedNeutralRgb = ColorUtils.oklchToRgb(
            neutralOklab[0],
            brandedNeutralChroma,
            primaryOklch[2],
        );
        const brandedNeutral = ColorUtils.createColor(brandedNeutralRgb);
        const neutralScale = this.generateScale(brandedNeutral);

        const semanticColors = this.generateSemanticColors(neutralScale, isDarkMode);

        if (isDarkMode) {
            const bg = neutralScale[950];
            const surface = neutralScale[900];
            const surfaceAlt = neutralScale[800];

            const rawText = neutralScale[50];
            const rawMuted = neutralScale[400];

            const text = this.enforceContrast(rawText, surface, 4.5);
            const textMuted = this.enforceContrast(rawMuted, surface, 4.5);

            return {
                primary: primary.hex,
                primaryScale,
                secondary: secondary.hex,
                secondaryScale,
                accent: accent.hex,
                accentScale,
                neutralScale,

                background: bg,
                surface,
                surfaceAlt,

                text,
                textMuted,
                textInverted: surface,

                ...semanticColors,
            };
        }

        const bg = neutralScale[50];
        const surface = '#FFFFFF';
        const surfaceAlt = neutralScale[100];

        const rawText = neutralScale[900];
        const rawMuted = neutralScale[600];

        const text = this.enforceContrast(rawText, surface, 4.5);
        const textMuted = this.enforceContrast(rawMuted, surface, 4.5);

        return {
            primary: primary.hex,
            primaryScale,
            secondary: secondary.hex,
            secondaryScale,
            accent: accent.hex,
            accentScale,
            neutralScale,

            background: bg,
            surface,
            surfaceAlt,

            text,
            textMuted,
            textInverted: '#FFFFFF',

            ...semanticColors,
        };
    }

    // ─── Semantic Colors ─────────────────────────────────────
    private static generateSemanticColors(
        neutralScale: ColorScale,
        isDarkMode: boolean,
    ): { success: string; warning: string; danger: string; info: string } {
        const neutral900Rgb = ColorUtils.hexToRgb(neutralScale[900]);
        const neutralOklch = ColorUtils.rgbToOklch(neutral900Rgb[0], neutral900Rgb[1], neutral900Rgb[2]);
        const brandHue = neutralOklch[2];

        const semanticDefs = [
            { key: 'success', H: 145, C: 0.17 },
            { key: 'warning', H: 75,  C: 0.17 },
            { key: 'danger',  H: 25,  C: 0.19 },
            { key: 'info',    H: 250, C: 0.13 },
        ] as const;

        const result: Record<string, string> = {};

        for (const def of semanticDefs) {
            const L = isDarkMode ? 0.72 : 0.55;
            const blendedH = (def.H * 0.95 + brandHue * 0.05) % 360;
            result[def.key] = ColorUtils.safeOklchToHex(L, def.C, blendedH);
        }

        return result as { success: string; warning: string; danger: string; info: string };
    }
}
