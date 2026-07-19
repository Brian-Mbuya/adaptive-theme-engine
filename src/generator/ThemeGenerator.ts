import type { Theme, ThemeStyle, Color } from '../model/Theme';
import { ColorGenerator } from './ColorGenerator';
import { StyleGenerator } from './StyleGenerator';

export class ThemeGenerator {
    public static generate(
        organizationName: string, 
        style: ThemeStyle, 
        primaryColor: Color, 
        secondaryColor: Color, 
        neutralColor: Color
    ): Theme {
        const id = `theme-${Date.now()}`;
        const name = `${organizationName} ${style} Theme`;

        const colors = ColorGenerator.generateColors(primaryColor, secondaryColor, neutralColor);
        const typography = StyleGenerator.generateTypography(style);
        const styles = StyleGenerator.generateStyles(style);

        return {
            id,
            name,
            style,
            colors,
            typography,
            styles
        };
    }
}
