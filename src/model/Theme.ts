export interface Color {
    hex: string;
    rgb: [number, number, number];
    hsl: [number, number, number];
}

export type ThemeStyle = 'Professional' | 'Academic' | 'Modern' | 'Corporate' | 'Minimal';

export interface ColorScale {
    50: string;
    100: string;
    200: string;
    300: string;
    400: string;
    500: string; // Base color
    600: string;
    700: string;
    800: string;
    900: string;
}

export interface ThemeColors {
    primary: string;
    primaryScale: ColorScale;
    secondary: string;
    secondaryScale: ColorScale;
    accent: string;
    accentScale: ColorScale;
    neutralScale: ColorScale;
    
    // Background and surfaces
    background: string;
    surface: string;
    surfaceAlt: string;
    
    // Text colors
    text: string;
    textMuted: string;
    textInverted: string;
    
    // Semantic colors
    success: string;
    warning: string;
    danger: string;
    info: string;
}

export interface ThemeTypography {
    fontFamily: string;
    headingFontFamily: string;
    baseFontSize: string;
    scale: {
        h1: string;
        h2: string;
        h3: string;
        h4: string;
        h5: string;
        h6: string;
        p: string;
        small: string;
    }
}

export interface ThemeStyles {
    borderRadius: {
        small: string;
        base: string;
        large: string;
        full: string;
        card: string;
        button: string;
        input: string;
    };
    shadows: {
        small: string;
        base: string;
        medium: string;
        large: string;
    };
    spacing: {
        1: string;
        2: string;
        3: string;
        4: string;
        5: string;
        6: string;
        8: string;
        10: string;
        12: string;
        16: string;
    };
}

export interface Theme {
    id: string;
    name: string;
    style: ThemeStyle;
    colors: ThemeColors;
    typography: ThemeTypography;
    styles: ThemeStyles;
}
