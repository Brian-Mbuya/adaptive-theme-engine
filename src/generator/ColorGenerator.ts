import { ColorUtils } from '../util/ColorUtils';
import type { ColorScale, Color, ThemeColors } from '../model/Theme';

export class ColorGenerator {
    private static generateScale(baseColor: Color): ColorScale {
        const oklab = ColorUtils.rgbToOklab(baseColor.rgb[0], baseColor.rgb[1], baseColor.rgb[2]);
        const a = oklab[1];
        const b = oklab[2];

        // Oklab Lightness mapping for standard UI palette (50-950)
        // L in Oklab typically ranges from ~0.0 (black) to ~1.0 (white).
        const scale: any = {};
        const steps = [
            { level: 50, L: 0.97 },
            { level: 100, L: 0.93 },
            { level: 200, L: 0.86 },
            { level: 300, L: 0.77 },
            { level: 400, L: 0.68 },
            { level: 500, L: Math.max(0.2, Math.min(0.8, oklab[0])) }, // Use actual color's L for 500 (clamped)
            { level: 600, L: 0.50 },
            { level: 700, L: 0.40 },
            { level: 800, L: 0.32 },
            { level: 900, L: 0.24 },
            { level: 950, L: 0.15 }
        ];

        for (const step of steps) {
            // Adjust chroma slightly towards neutral at the extreme ends
            let chromaMultiplier = 1.0;
            if (step.level <= 100) chromaMultiplier = 0.6;
            if (step.level >= 800) chromaMultiplier = 0.8;

            const rgb = ColorUtils.oklabToRgb(step.L, a * chromaMultiplier, b * chromaMultiplier);
            scale[step.level] = ColorUtils.rgbToHex(rgb[0], rgb[1], rgb[2]);
        }
        
        // Ensure the exact base hex is present at level 500
        scale[500] = baseColor.hex;

        return scale as ColorScale;
    }

    public static generateColors(primary: Color, secondary: Color, neutral: Color): ThemeColors {
        const primaryScale = this.generateScale(primary);
        const secondaryScale = this.generateScale(secondary);
        const accentScale = this.generateScale(secondary);

        // Deeply integrate primary branding into neutrals
        const brandedNeutral: Color = {
            hex: neutral.hex,
            rgb: neutral.rgb,
            // Force primary hue, low saturation (8-12%) for a premium tinted look
            hsl: [primary.hsl[0], Math.max(8, Math.min(12, primary.hsl[1] * 0.25)), neutral.hsl[2]]
        };
        const neutralScale = this.generateScale(brandedNeutral);

        return {
            primary: primary.hex,
            primaryScale,
            secondary: secondary.hex,
            secondaryScale,
            accent: secondary.hex, // Using secondary as accent for simplicity
            accentScale,
            neutralScale,

            // Surfaces
            background: neutralScale[50], // Lightest neutral
            surface: '#FFFFFF',
            surfaceAlt: neutralScale[100],

            // Text
            text: neutralScale[900],
            textMuted: neutralScale[600],
            textInverted: '#FFFFFF',

            // Semantic (Fixed for now, could be slightly adjusted based on primary hue)
            success: '#10B981', // Emerald 500
            warning: '#F59E0B', // Amber 500
            danger: '#EF4444',  // Red 500
            info: '#3B82F6',    // Blue 500
        };
    }
}
