import type { Theme } from '../model/Theme';

export class ExportPanel {
    public static render(theme: Theme) {
        const modal = document.getElementById('export-modal');
        const cssCode = document.getElementById('css-export');
        const twCode = document.getElementById('tailwind-export');
        const jsonCode = document.getElementById('json-export');
        const closeBtn = document.getElementById('close-modal');

        if (!modal || !cssCode || !twCode || !jsonCode || !closeBtn) return;

        // --- Generate CSS Variables ---
        // Mirroring exactly what ThemeApplier sets
        let cssStr = '/* Adaptive Theme Engine Export */\n';
        cssStr += ':root {\n';
        
        const scales = [
            { name: 'primary', scale: theme.colors.primaryScale, base: theme.colors.primary },
            { name: 'secondary', scale: theme.colors.secondaryScale, base: theme.colors.secondary },
            { name: 'accent', scale: theme.colors.accentScale, base: theme.colors.accent },
            { name: 'neutral', scale: theme.colors.neutralScale, base: theme.colors.neutralScale[500] }
        ];

        // Output all scales
        for (const { name, scale, base } of scales) {
            cssStr += `  /* ${name.charAt(0).toUpperCase() + name.slice(1)} Scale */\n`;
            Object.entries(scale).forEach(([level, hex]) => {
                cssStr += `  --color-${name}-${level}: ${hex};\n`;
            });
            cssStr += `  --color-${name}: ${base};\n\n`;
        }

        cssStr += '  /* Surfaces & Text */\n';
        cssStr += `  --color-background: ${theme.colors.background};\n`;
        cssStr += `  --color-surface: ${theme.colors.surface};\n`;
        cssStr += `  --color-surface-alt: ${theme.colors.surfaceAlt};\n`;
        cssStr += `  --color-text: ${theme.colors.text};\n`;
        cssStr += `  --color-text-muted: ${theme.colors.textMuted};\n`;
        cssStr += `  --color-text-inverted: ${theme.colors.textInverted};\n\n`;

        cssStr += '  /* Semantic */\n';
        cssStr += `  --color-success: ${theme.colors.success};\n`;
        cssStr += `  --color-warning: ${theme.colors.warning};\n`;
        cssStr += `  --color-danger: ${theme.colors.danger};\n`;
        cssStr += `  --color-info: ${theme.colors.info};\n\n`;

        cssStr += '  /* Typography */\n';
        cssStr += `  --font-family-base: ${theme.typography.fontFamily};\n`;
        cssStr += `  --font-family-heading: ${theme.typography.headingFontFamily};\n`;
        cssStr += `  --font-size-base: ${theme.typography.baseFontSize};\n`;
        Object.entries(theme.typography.scale).forEach(([key, val]) => {
            cssStr += `  --font-size-${key}: ${val};\n`;
        });
        cssStr += '\n';

        cssStr += '  /* Styles (Radius, Shadow, Spacing) */\n';
        Object.entries(theme.styles.borderRadius).forEach(([key, val]) => {
            cssStr += `  --border-radius-${key}: ${val};\n`;
        });
        Object.entries(theme.styles.shadows).forEach(([key, val]) => {
            cssStr += `  --shadow-${key}: ${val};\n`;
        });
        Object.entries(theme.styles.spacing).forEach(([key, val]) => {
            cssStr += `  --spacing-${key}: ${val};\n`;
        });

        cssStr += '}';
        cssCode.textContent = cssStr;


        // --- Generate Tailwind Config ---
        const twStr = `/** @type {import('tailwindcss').Config} */
module.exports = {
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
          950: '${theme.colors.primaryScale[950]}',
          DEFAULT: '${theme.colors.primary}',
        },
        secondary: {
          50: '${theme.colors.secondaryScale[50]}',
          100: '${theme.colors.secondaryScale[100]}',
          200: '${theme.colors.secondaryScale[200]}',
          300: '${theme.colors.secondaryScale[300]}',
          400: '${theme.colors.secondaryScale[400]}',
          500: '${theme.colors.secondaryScale[500]}',
          600: '${theme.colors.secondaryScale[600]}',
          700: '${theme.colors.secondaryScale[700]}',
          800: '${theme.colors.secondaryScale[800]}',
          900: '${theme.colors.secondaryScale[900]}',
          950: '${theme.colors.secondaryScale[950]}',
          DEFAULT: '${theme.colors.secondary}',
        },
        accent: {
          50: '${theme.colors.accentScale[50]}',
          100: '${theme.colors.accentScale[100]}',
          200: '${theme.colors.accentScale[200]}',
          300: '${theme.colors.accentScale[300]}',
          400: '${theme.colors.accentScale[400]}',
          500: '${theme.colors.accentScale[500]}',
          600: '${theme.colors.accentScale[600]}',
          700: '${theme.colors.accentScale[700]}',
          800: '${theme.colors.accentScale[800]}',
          900: '${theme.colors.accentScale[900]}',
          950: '${theme.colors.accentScale[950]}',
          DEFAULT: '${theme.colors.accent}',
        },
        neutral: {
          50: '${theme.colors.neutralScale[50]}',
          100: '${theme.colors.neutralScale[100]}',
          200: '${theme.colors.neutralScale[200]}',
          300: '${theme.colors.neutralScale[300]}',
          400: '${theme.colors.neutralScale[400]}',
          500: '${theme.colors.neutralScale[500]}',
          600: '${theme.colors.neutralScale[600]}',
          700: '${theme.colors.neutralScale[700]}',
          800: '${theme.colors.neutralScale[800]}',
          900: '${theme.colors.neutralScale[900]}',
          950: '${theme.colors.neutralScale[950]}',
          DEFAULT: '${theme.colors.neutralScale[500]}',
        },
        semantic: {
          success: '${theme.colors.success}',
          warning: '${theme.colors.warning}',
          danger: '${theme.colors.danger}',
          info: '${theme.colors.info}',
        }
      },
      fontFamily: {
        sans: [${theme.typography.fontFamily.split(',').map(f => `'${f.trim().replace(/^['"]|['"]$/g, '')}'`).join(', ')}],
        heading: [${theme.typography.headingFontFamily.split(',').map(f => `'${f.trim().replace(/^['"]|['"]$/g, '')}'`).join(', ')}],
      },
      borderRadius: {
        'theme-small': '${theme.styles.borderRadius.small}',
        'theme-base': '${theme.styles.borderRadius.base}',
        'theme-large': '${theme.styles.borderRadius.large}',
        'theme-card': '${theme.styles.borderRadius.card}',
        'theme-btn': '${theme.styles.borderRadius.button}',
        'theme-input': '${theme.styles.borderRadius.input}',
      },
      boxShadow: {
        'theme-small': '${theme.styles.shadows.small}',
        'theme-base': '${theme.styles.shadows.base}',
        'theme-medium': '${theme.styles.shadows.medium}',
        'theme-large': '${theme.styles.shadows.large}',
      }
    }
  }
}`;
        twCode.textContent = twStr;

        // --- Generate JSON ---
        jsonCode.textContent = JSON.stringify(theme, null, 2);

        // --- Show Modal ---
        modal.style.display = 'flex';

        closeBtn.onclick = () => {
            modal.style.display = 'none';
        };

        modal.onclick = (e) => {
            if (e.target === modal) {
                modal.style.display = 'none';
            }
        };

        // --- Copy Buttons ---
        this.setupCopyButton('btn-copy-css', cssStr);
        this.setupCopyButton('btn-copy-tw', twStr);
        this.setupCopyButton('btn-copy-json', jsonCode.textContent);
    }

    private static setupCopyButton(btnId: string, content: string) {
        const btn = document.getElementById(btnId) as HTMLButtonElement;
        if (btn) {
            // Remove old listeners by cloning
            const newBtn = btn.cloneNode(true) as HTMLButtonElement;
            btn.parentNode?.replaceChild(newBtn, btn);
            
            newBtn.addEventListener('click', async () => {
                try {
                    await navigator.clipboard.writeText(content);
                    const originalText = newBtn.textContent;
                    newBtn.textContent = 'Copied!';
                    setTimeout(() => {
                        newBtn.textContent = originalText;
                    }, 2000);
                } catch (err) {
                    console.error('Failed to copy', err);
                }
            });
        }
    }
}
