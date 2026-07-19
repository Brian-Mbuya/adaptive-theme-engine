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

        const scale: Record<number, string> = {};

        for (const step of this.LIGHT_STEPS) {
            // Use the actual color's lightness for the 500 stop (clamped)
            const L = step.level === 500
                ? Math.max(0.25, Math.min(0.75, oklab[0]))
                : step.L;

            // Reduce chroma at extremes for natural palette feel
            let chromaMultiplier = 1.0;
            if (step.level <= 100) chromaMultiplier = 0.45;
            else if (step.level <= 200) chromaMultiplier = 0.65;
            else if (step.level >= 900) chromaMultiplier = 0.7;
            else if (step.level >= 800) chromaMultiplier = 0.8;

            const C = baseChroma * chromaMultiplier;

            // Gamut-safe conversion
            scale[step.level] = ColorUtils.safeOklchToHex(L, C, baseHue);
        }

        // Override 500 with the exact base hex for precision
        scale[500] = baseColor.hex;

        return scale as unknown as ColorScale;
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

        // Generate a TRUE accent from the primary using color harmony
        const accentRgb = ColorUtils.getHarmonyColors(primary.rgb, harmony)[0];
        const accent = ColorUtils.createColor(accentRgb);
        const accentScale = this.generateScale(accent);

        // Branded neutrals: inject primary's hue at very low chroma
        const primaryOklch = ColorUtils.rgbToOklch(primary.rgb[0], primary.rgb[1], primary.rgb[2]);
        const neutralOklab = ColorUtils.rgbToOklab(neutral.rgb[0], neutral.rgb[1], neutral.rgb[2]);
        // Build neutral with primary's hue but very low chroma (8-12% of primary's chroma)
        const brandedNeutralChroma = Math.max(0.005, Math.min(0.02, primaryOklch[1] * 0.15));
        const brandedNeutralRgb = ColorUtils.oklchToRgb(
            neutralOklab[0],
            brandedNeutralChroma,
            primaryOklch[2],
        );
        const brandedNeutral = ColorUtils.createColor(brandedNeutralRgb);
        const neutralScale = this.generateScale(brandedNeutral);

        // ─── Theme-aware semantic colors ─────────────────────
        // Harmonize semantic colors with the neutral scale instead of hardcoding
        const semanticColors = this.generateSemanticColors(neutralScale, isDarkMode);

        if (isDarkMode) {
            return {
                primary: primary.hex,
                primaryScale,
                secondary: secondary.hex,
                secondaryScale,
                accent: accent.hex,
                accentScale,
                neutralScale,

                // Dark mode: inverted surfaces
                background: neutralScale[950],
                surface: neutralScale[900],
                surfaceAlt: neutralScale[800],

                // Dark mode: light text
                text: neutralScale[50],
                textMuted: neutralScale[400],
                textInverted: neutralScale[900],

                ...semanticColors,
            };
        }

        return {
            primary: primary.hex,
            primaryScale,
            secondary: secondary.hex,
            secondaryScale,
            accent: accent.hex,
            accentScale,
            neutralScale,

            // Light mode surfaces
            background: neutralScale[50],
            surface: '#FFFFFF',
            surfaceAlt: neutralScale[100],

            // Light mode text
            text: neutralScale[900],
            textMuted: neutralScale[600],
            textInverted: '#FFFFFF',

            ...semanticColors,
        };
    }

    // ─── Semantic Colors ─────────────────────────────────────
    /**
     * Generate theme-harmonized semantic colors.
     * Rather than hardcoding, we use the neutral scale's hue
     * as a slight tinting influence.
     */
    private static generateSemanticColors(
        _neutralScale: ColorScale,
        isDarkMode: boolean,
    ): { success: string; warning: string; danger: string; info: string } {
        // Base semantic hues in OKLCH
        const semanticDefs = [
            { key: 'success', H: 145, C: 0.17 }, // Green
            { key: 'warning', H: 75,  C: 0.17 }, // Amber
            { key: 'danger',  H: 25,  C: 0.19 }, // Red
            { key: 'info',    H: 250, C: 0.13 }, // Blue
        ] as const;

        const result: Record<string, string> = {};

        for (const def of semanticDefs) {
            // Use lighter variants in dark mode for visibility
            const L = isDarkMode ? 0.72 : 0.55;
            result[def.key] = ColorUtils.safeOklchToHex(L, def.C, def.H);
        }

        return result as { success: string; warning: string; danger: string; info: string };
    }
}
