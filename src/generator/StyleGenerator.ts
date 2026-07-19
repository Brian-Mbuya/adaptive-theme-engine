import type { ThemeStyle, ThemeTypography, ThemeStyles } from '../model/Theme';

export class StyleGenerator {
    public static generateTypography(style: ThemeStyle): ThemeTypography {
        let fontFamily = "'Inter', sans-serif";
        let headingFontFamily = "'Inter', sans-serif";

        switch (style) {
            case 'Professional':
                headingFontFamily = "'Merriweather', serif";
                fontFamily = "'Open Sans', sans-serif";
                break;
            case 'Academic':
                headingFontFamily = "'Playfair Display', serif";
                fontFamily = "'Lora', serif";
                break;
            case 'Modern':
                headingFontFamily = "'Outfit', sans-serif";
                fontFamily = "'Inter', sans-serif";
                break;
            case 'Corporate':
                headingFontFamily = "'Roboto', sans-serif";
                fontFamily = "'Roboto', sans-serif";
                break;
            case 'Minimal':
                headingFontFamily = "'Helvetica Neue', sans-serif";
                fontFamily = "'Helvetica Neue', sans-serif";
                break;
        }

        return {
            fontFamily,
            headingFontFamily,
            baseFontSize: '16px',
            scale: {
                h1: '2.5rem',
                h2: '2rem',
                h3: '1.75rem',
                h4: '1.5rem',
                h5: '1.25rem',
                h6: '1rem',
                p: '1rem',
                small: '0.875rem'
            }
        };
    }

    public static generateStyles(style: ThemeStyle): ThemeStyles {
        let borderRadius = {
            small: '0.25rem',
            base: '0.5rem',
            large: '1rem',
            full: '9999px',
            card: '0.5rem',
            button: '0.5rem',
            input: '0.375rem'
        };

        let shadows = {
            small: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
            base: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
            medium: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
            large: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
        };

        switch (style) {
            case 'Modern':
                borderRadius.card = '1rem';
                borderRadius.button = '9999px'; // Pill buttons
                shadows.base = '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)';
                break;
            case 'Corporate':
                borderRadius.card = '0.25rem';
                borderRadius.button = '0.25rem';
                break;
            case 'Minimal':
                borderRadius.card = '0px';
                borderRadius.button = '0px';
                borderRadius.input = '0px';
                shadows.base = 'none';
                shadows.medium = 'none';
                shadows.large = 'none';
                break;
            case 'Professional':
                borderRadius.card = '0.5rem';
                borderRadius.button = '0.375rem';
                break;
            case 'Academic':
                borderRadius.card = '0.25rem';
                borderRadius.button = '0.25rem';
                break;
        }

        return {
            borderRadius,
            shadows,
            spacing: {
                1: '0.25rem',
                2: '0.5rem',
                3: '0.75rem',
                4: '1rem',
                5: '1.25rem',
                6: '1.5rem',
                8: '2rem',
                10: '2.5rem',
                12: '3rem',
                16: '4rem'
            }
        };
    }
}
