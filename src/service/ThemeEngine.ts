import type { Theme, ThemeStyle, ColorHarmony } from '../model/Theme';
import { ColorExtractor } from '../extractor/ColorExtractor';
import { ThemeGenerator } from '../generator/ThemeGenerator';
import { ThemeApplier } from '../theme/ThemeApplier';
import { ColorUtils } from '../util/ColorUtils';

export interface ThemeOverrides {
    primary?: string;
    secondary?: string;
    neutral?: string;
}

export class ThemeEngine {
    private extractor: ColorExtractor;

    constructor() {
        this.extractor = new ColorExtractor();
    }

    /**
     * Generates a complete design system theme based on an organization's logo and preferred style.
     */
    public async generateTheme(
        imageSrc: string,
        orgName: string,
        style: ThemeStyle = 'Modern',
        harmony: ColorHarmony = 'Complementary',
        isDarkMode: boolean = false,
        overrides?: ThemeOverrides
    ): Promise<Theme> {
        // 1. Extract base colors from the logo
        let { primary, secondary, neutral } = await this.extractor.extractColors(imageSrc);

        // Apply overrides if any
        if (overrides) {
            if (overrides.primary) primary = ColorUtils.parseColor(overrides.primary);
            if (overrides.secondary) secondary = ColorUtils.parseColor(overrides.secondary);
            if (overrides.neutral) neutral = ColorUtils.parseColor(overrides.neutral);
        }

        // 2. Generate the complete Theme object
        const theme = ThemeGenerator.generate(
            orgName,
            style,
            primary,
            secondary,
            neutral,
            harmony,
            isDarkMode
        );

        return theme;
    }

    /**
     * Instantly applies a generated Theme to the current document using CSS variables.
     */
    public applyTheme(theme: Theme): void {
        ThemeApplier.apply(theme);
    }
}
