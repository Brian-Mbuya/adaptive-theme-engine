import type { Theme, ColorScale } from '../model/Theme';
import { ColorUtils } from '../util/ColorUtils';

export class ThemeApplier {
    public static apply(theme: Theme): void {
        const root = document.documentElement;

        // Apply Primary Scale
        this.applyColorScale(root, 'primary', theme.colors.primaryScale);
        // Apply Secondary Scale
        this.applyColorScale(root, 'secondary', theme.colors.secondaryScale);
        // Apply Accent Scale
        this.applyColorScale(root, 'accent', theme.colors.accentScale);
        // Apply Neutral Scale
        this.applyColorScale(root, 'neutral', theme.colors.neutralScale);

        // Surfaces and Backgrounds
        root.style.setProperty('--color-background', theme.colors.background);
        root.style.setProperty('--color-surface', theme.colors.surface);
        root.style.setProperty('--color-surface-alt', theme.colors.surfaceAlt);

        // Text
        root.style.setProperty('--color-text', theme.colors.text);
        root.style.setProperty('--color-text-muted', theme.colors.textMuted);
        root.style.setProperty('--color-text-inverted', theme.colors.textInverted);

        // Semantic
        root.style.setProperty('--color-success', theme.colors.success);
        root.style.setProperty('--color-warning', theme.colors.warning);
        root.style.setProperty('--color-danger', theme.colors.danger);
        root.style.setProperty('--color-info', theme.colors.info);

        // Calculate Contrast-Aware Text Shadow for primary background
        const primaryHsl = ColorUtils.hexToHsl(theme.colors.primary);
        const isDark = primaryHsl[2] < 60; // if lightness < 60%, it's dark
        const shadowText = isDark 
            ? '0 2px 4px rgba(0,0,0,0.5)' 
            : '0 1px 2px rgba(255,255,255,0.8)';
        root.style.setProperty('--shadow-text', shadowText);

        // Typography
        root.style.setProperty('--font-family-base', theme.typography.fontFamily);
        root.style.setProperty('--font-family-heading', theme.typography.headingFontFamily);
        root.style.setProperty('--font-size-base', theme.typography.baseFontSize);

        Object.entries(theme.typography.scale).forEach(([key, value]) => {
            root.style.setProperty(`--font-size-${key}`, value);
        });

        // Styles (Border Radius)
        Object.entries(theme.styles.borderRadius).forEach(([key, value]) => {
            root.style.setProperty(`--border-radius-${key}`, value);
        });

        // Styles (Shadows)
        Object.entries(theme.styles.shadows).forEach(([key, value]) => {
            root.style.setProperty(`--shadow-${key}`, value);
        });

        // Styles (Spacing)
        Object.entries(theme.styles.spacing).forEach(([key, value]) => {
            root.style.setProperty(`--spacing-${key}`, value);
        });
    }

    private static applyColorScale(root: HTMLElement, prefix: string, scale: ColorScale) {
        Object.entries(scale).forEach(([level, hexValue]) => {
            root.style.setProperty(`--color-${prefix}-${level}`, hexValue);
            // also set base value (e.g. --color-primary is --color-primary-500)
            if (level === '500') {
                root.style.setProperty(`--color-${prefix}`, hexValue);
            }
        });
    }
}
