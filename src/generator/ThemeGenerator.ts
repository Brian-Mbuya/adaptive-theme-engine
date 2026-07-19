import type { Theme, ThemeStyle, Color, ColorHarmony } from '../model/Theme';
import { ColorGenerator } from './ColorGenerator';
import { StyleGenerator } from './StyleGenerator';

export class ThemeGenerator {
    public static generate(
        organizationName: string,
        style: ThemeStyle,
        primaryColor: Color,
        secondaryColor: Color,
        neutralColor: Color,
        harmony: ColorHarmony = 'Complementary',
        isDarkMode: boolean = false
    ): Theme {
        const id = `theme-${Date.now()}`;
        const name = `${organizationName} ${style} Theme`;

        const colors = ColorGenerator.generateColors(
            primaryColor,
            secondaryColor,
            neutralColor,
            harmony,
            isDarkMode
        );
        const typography = StyleGenerator.generateTypography(style);
        const styles = StyleGenerator.generateStyles(style);

        return {
            id,
            name,
            style,
            colorHarmony: harmony,
            isDarkMode,
            colors,
            typography,
            styles,
        };
    }
}
