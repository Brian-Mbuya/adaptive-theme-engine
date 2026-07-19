import type { Theme } from '../model/Theme';

export class ExportPanel {
    public static render(theme: Theme) {
        const modal = document.getElementById('export-modal');
        const cssCode = document.getElementById('css-export');
        const twCode = document.getElementById('tailwind-export');
        const closeBtn = document.getElementById('close-modal');

        if (!modal || !cssCode || !twCode || !closeBtn) return;

        // Generate CSS variables
        let cssStr = ':root {\\n';
        cssStr += `  --color-primary: ${theme.colors.primary};\\n`;
        cssStr += `  --color-secondary: ${theme.colors.secondary};\\n`;
        cssStr += `  --color-accent: ${theme.colors.accent};\\n`;
        cssStr += `  --color-background: ${theme.colors.background};\\n`;
        cssStr += `  --color-surface: ${theme.colors.surface};\\n`;
        cssStr += `  --color-text: ${theme.colors.text};\\n`;
        cssStr += `  --color-text-muted: ${theme.colors.textMuted};\\n`;
        cssStr += `  --font-family-base: ${theme.typography.fontFamily};\\n`;
        cssStr += `  --font-family-heading: ${theme.typography.headingFontFamily};\\n`;
        cssStr += '}';
        cssCode.textContent = cssStr;

        // Generate Tailwind config
        const twStr = `module.exports = {
  theme: {
    extend: {
      colors: {
        primary: {
          50: '${theme.colors.primaryScale[50]}',
          100: '${theme.colors.primaryScale[100]}',
          200: '${theme.colors.primaryScale[200]}',
          300: '${theme.colors.primaryScale[300]}',
          400: '${theme.colors.primaryScale[400]}',
          500: '${theme.colors.primaryScale[500]}',
          600: '${theme.colors.primaryScale[600]}',
          700: '${theme.colors.primaryScale[700]}',
          800: '${theme.colors.primaryScale[800]}',
          900: '${theme.colors.primaryScale[900]}',
        },
        secondary: {
          500: '${theme.colors.secondary}',
        },
        neutral: {
          500: '${theme.colors.neutralScale[500]}',
        }
      },
      fontFamily: {
        sans: ['${theme.typography.fontFamily}', 'sans-serif'],
        heading: ['${theme.typography.headingFontFamily}', 'sans-serif'],
      }
    }
  }
}`;
        twCode.textContent = twStr;

        modal.style.display = 'flex';

        closeBtn.onclick = () => {
            modal.style.display = 'none';
        };

        modal.onclick = (e) => {
            if (e.target === modal) {
                modal.style.display = 'none';
            }
        };
    }
}
