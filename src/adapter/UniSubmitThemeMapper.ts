import type { Theme } from '../model/Theme';
import { ColorUtils } from '../util/ColorUtils';
import { ColorGenerator } from '../generator/ColorGenerator';

export interface UniSubmitTokens {
    '--primary': string;
    '--primary-strong': string;
    '--brand': string;
    '--brand-strong': string;
    '--gold': string;
    '--gold-bright': string;
    '--gold-dim': string;
    '--canvas': string;
    '--bg': string;
    '--surface': string;
    '--surface-solid': string;
    '--surface-muted': string;
    '--surface-2': string;
    '--bg-elevated': string;
    '--text': string;
    '--text-muted': string;
    '--text-subtle': string;
    '--text-on-brand': string;
    '--border': string;
    '--border-muted': string;
    '--border-strong': string;
}

export class UniSubmitThemeMapper {
    /**
     * Map a Theme engine theme to UniSubmit's ~18 brand & surface CSS tokens.
     * Enforces WCAG AA contrast for text on surface and brand on white.
     */
    public static mapTheme(theme: Theme): UniSubmitTokens {
        const colors = theme.colors;

        // Force WCAG AA contrast for brand on white (#FFFFFF)
        const brand = ColorGenerator.enforceContrast(colors.primaryScale[500], '#FFFFFF', 4.5);
        const brandStrong = ColorGenerator.enforceContrast(colors.primaryScale[600], '#FFFFFF', 4.5);

        // Surfaces (dark-mode ink surfaces)
        const canvas = colors.neutralScale[950];
        const surface = colors.neutralScale[900];

        // Text contrast vs surface
        const text = ColorGenerator.enforceContrast(colors.neutralScale[50], surface, 4.5);
        const textMuted = ColorGenerator.enforceContrast(colors.neutralScale[400], surface, 4.5);
        const textSubtle = colors.neutralScale[500];

        // Gold brass companion
        const goldHex = colors.secondaryScale[300];
        const goldRgb = ColorUtils.hexToRgb(goldHex);
        const goldDim = `rgba(${goldRgb[0]}, ${goldRgb[1]}, ${goldRgb[2]}, 0.32)`;

        return {
            '--primary': colors.primaryScale[300],
            '--primary-strong': colors.primaryScale[200],
            '--brand': brand,
            '--brand-strong': brandStrong,
            '--gold': goldHex,
            '--gold-bright': colors.secondaryScale[200],
            '--gold-dim': goldDim,
            '--canvas': canvas,
            '--bg': canvas,
            '--surface': surface,
            '--surface-solid': surface,
            // Surface ladder, dark → light: canvas(950) < surface(900) < elevated/muted(800)
            // < surface-2(700). There is no 850 stop in ColorScale, and collapsing these onto
            // one value would flatten UniSubmit's depth layering — so surface-2 steps to 700.
            '--surface-muted': colors.neutralScale[800],
            '--surface-2': colors.neutralScale[700],
            '--bg-elevated': colors.neutralScale[800],
            '--text': text,
            '--text-muted': textMuted,
            '--text-subtle': textSubtle,
            '--text-on-brand': '#ffffff',
            '--border': colors.neutralScale[700],
            '--border-muted': colors.neutralScale[800],
            '--border-strong': colors.neutralScale[600],
        };
    }

    /**
     * Apply UniSubmit tokens directly to document element (or target container) for live preview.
     */
    public static applyToDocument(tokens: Record<string, string>, targetElement?: HTMLElement): void {
        const root = targetElement || document.documentElement;
        for (const [key, value] of Object.entries(tokens)) {
            if (key.startsWith('--')) {
                root.style.setProperty(key, value);
            }
        }
    }

    /**
     * Export persistence-ready JSON payload with versioning.
     */
    public static exportJson(tokens: Record<string, string>): string {
        return JSON.stringify({
            themeVersion: 1,
            tokens,
        }, null, 2);
    }
}
