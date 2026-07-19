import { ThemeEngine } from '../service/ThemeEngine';
import { LogoProcessor } from '../extractor/LogoProcessor';
import { ExportPanel } from '../ui/ExportPanel';
import type { ThemeStyle, Theme, ColorHarmony } from '../model/Theme';

class AppController {
    private engine: ThemeEngine;
    private logoSrc: string | null = null;
    private currentTheme: Theme | null = null;
    private tweakTimeout: number | null = null;
    private hasTweakOverrides = false;

    // UI Elements
    private dropZone = document.getElementById('drop-zone') as HTMLDivElement;
    private logoInput = document.getElementById('logo-input') as HTMLInputElement;
    private logoPreview = document.getElementById('logo-preview') as HTMLImageElement;
    private uploadText = document.getElementById('upload-text') as HTMLParagraphElement;

    private orgNameInput = document.getElementById('org-name') as HTMLInputElement;
    private themeStyleSelect = document.getElementById('theme-style') as HTMLSelectElement;
    private harmonySelect = document.getElementById('color-harmony') as HTMLSelectElement;
    private darkModeToggle = document.getElementById('dark-mode-toggle') as HTMLInputElement;
    
    private generateBtn = document.getElementById('generate-btn') as HTMLButtonElement;
    private exportBtn = document.getElementById('export-btn') as HTMLButtonElement;
    
    private previewBrand = document.getElementById('preview-brand') as HTMLDivElement;
    private loadingProgress = document.getElementById('loading-progress') as HTMLDivElement;

    constructor() {
        this.engine = new ThemeEngine();
        this.initEventListeners();
    }

    private initEventListeners() {
        // Drop zone events
        this.dropZone.addEventListener('click', () => this.logoInput.click());
        this.dropZone.addEventListener('dragover', (e) => {
            e.preventDefault();
            this.dropZone.style.borderColor = 'var(--color-primary)';
            this.dropZone.style.backgroundColor = 'var(--color-primary-50)';
        });
        this.dropZone.addEventListener('dragleave', (e) => {
            e.preventDefault();
            this.dropZone.style.borderColor = '';
            this.dropZone.style.backgroundColor = '';
        });
        this.dropZone.addEventListener('drop', (e) => {
            e.preventDefault();
            this.dropZone.style.borderColor = '';
            this.dropZone.style.backgroundColor = '';
            if (e.dataTransfer && e.dataTransfer.files.length > 0) {
                this.handleFile(e.dataTransfer.files[0]);
            }
        });

        // File input change
        this.logoInput.addEventListener('change', (e) => {
            const target = e.target as HTMLInputElement;
            if (target.files && target.files.length > 0) {
                this.handleFile(target.files[0]);
            }
        });

        // Live update organization name
        this.orgNameInput.addEventListener('input', () => {
            this.previewBrand.textContent = this.orgNameInput.value || 'Acme Corp';
        });

        // Configuration change handlers (instant regen if theme exists)
        this.themeStyleSelect.addEventListener('change', () => this.triggerRegeneration());
        this.harmonySelect.addEventListener('change', () => this.triggerRegeneration());
        this.darkModeToggle.addEventListener('change', () => {
            if (this.currentTheme) {
                // Instantly toggle class for background color
                document.body.classList.toggle('dark-mode', this.darkModeToggle.checked);
                this.triggerRegeneration();
            }
        });

        // Main generate button click
        this.generateBtn.addEventListener('click', () => this.generateTheme(false));
        
        // Listen for tweak changes to instantly regenerate (with debounce)
        const tweakInputs = ['tweak-primary', 'tweak-secondary', 'tweak-neutral'];
        tweakInputs.forEach(id => {
            const input = document.getElementById(id) as HTMLInputElement;
            if (input) {
                input.addEventListener('input', () => {
                    this.hasTweakOverrides = true;
                    if (this.tweakTimeout) clearTimeout(this.tweakTimeout);
                    this.tweakTimeout = window.setTimeout(() => {
                        this.triggerRegeneration();
                    }, 300); // 300ms debounce
                });
            }
        });

        this.exportBtn.addEventListener('click', () => {
            if (this.currentTheme) {
                ExportPanel.render(this.currentTheme);
            }
        });
    }

    private handleFile(file: File) {
        if (!file.type.startsWith('image/')) {
            alert('Please upload an image file.');
            return;
        }

        const reader = new FileReader();
        reader.onload = (e) => {
            if (e.target && typeof e.target.result === 'string') {
                this.logoSrc = e.target.result;
                this.logoPreview.src = this.logoSrc;
                this.logoPreview.style.display = 'block';
                this.uploadText.style.display = 'none';
                
                // Enable generate button
                this.generateBtn.disabled = false;
                
                // Clear any previous overrides when a new logo is uploaded
                this.hasTweakOverrides = false;
            }
        };
        reader.readAsDataURL(file);
    }

    private triggerRegeneration() {
        if (this.logoSrc && this.currentTheme) {
            this.generateTheme(true); // skip OCR
        }
    }

    private async generateTheme(skipOCR: boolean = false) {
        if (!this.logoSrc) return;

        const originalText = this.generateBtn.textContent;
        this.generateBtn.textContent = skipOCR ? 'Updating Theme...' : 'Reading Logo & Generating...';
        this.generateBtn.disabled = true;
        
        if (!skipOCR) {
            this.loadingProgress.style.display = 'block';
        }

        try {
            let extractedName: string | null = null;
            let processImageSrc = this.logoSrc;

            // 1. Process Logo (OCR & Cropping) - only if we aren't just tweaking
            if (!skipOCR) {
                const result = await LogoProcessor.processLogo(this.logoSrc);
                extractedName = result.orgName;
                processImageSrc = result.croppedImageSrc;
            } else {
                // If skipping OCR, use the currently displayed preview logo src (which is cropped)
                const previewLogo = document.getElementById('preview-logo') as HTMLImageElement;
                if (previewLogo && previewLogo.src) {
                    processImageSrc = previewLogo.src;
                }
            }
            
            let orgName = this.orgNameInput.value.trim();
            
            // Auto-fill from OCR if empty
            if (!orgName && extractedName) {
                orgName = extractedName;
                this.orgNameInput.value = orgName;
                this.previewBrand.textContent = orgName;
            }

            const style = this.themeStyleSelect.value as ThemeStyle;
            const harmony = this.harmonySelect.value as ColorHarmony;
            const isDarkMode = this.darkModeToggle.checked;

            // Grab overrides if they were set
            let overrides = undefined;
            if (this.hasTweakOverrides) {
                const tweakPrimary = document.getElementById('tweak-primary') as HTMLInputElement;
                const tweakSecondary = document.getElementById('tweak-secondary') as HTMLInputElement;
                const tweakNeutral = document.getElementById('tweak-neutral') as HTMLInputElement;
                
                const tweaksPanel = document.getElementById('theme-tweaks');
                if (tweaksPanel && tweaksPanel.style.display === 'block') {
                    overrides = {
                        primary: tweakPrimary.value,
                        secondary: tweakSecondary.value,
                        neutral: tweakNeutral.value
                    };
                }
            }

            // 2. Generate
            const theme = await this.engine.generateTheme(
                processImageSrc, 
                orgName || 'Acme Corp', 
                style, 
                harmony,
                isDarkMode,
                overrides
            );
            
            this.currentTheme = theme;
            this.exportBtn.disabled = false;
            
            // Set dark mode class right before applying theme
            document.body.classList.toggle('dark-mode', isDarkMode);
            this.engine.applyTheme(theme);
            
            // Update preview logo
            const previewLogo = document.getElementById('preview-logo') as HTMLImageElement;
            previewLogo.src = processImageSrc;
            previewLogo.style.display = 'block';

            // Update tweak swatches (only if we didn't just tweak them)
            if (!this.hasTweakOverrides) {
                const tweakPrimary = document.getElementById('tweak-primary') as HTMLInputElement;
                const tweakSecondary = document.getElementById('tweak-secondary') as HTMLInputElement;
                const tweakNeutral = document.getElementById('tweak-neutral') as HTMLInputElement;
                
                tweakPrimary.value = theme.colors.primary;
                tweakSecondary.value = theme.colors.secondary;
                tweakNeutral.value = theme.colors.neutralScale[500];
            }
            
            const themeTweaks = document.getElementById('theme-tweaks') as HTMLElement;
            themeTweaks.style.display = 'block';

        } catch (error: any) {
            console.error('Error generating theme:', error);
            alert('Failed to generate theme. Error: ' + (error.message || error));
        } finally {
            this.generateBtn.textContent = originalText;
            this.generateBtn.disabled = false;
            this.loadingProgress.style.display = 'none';
        }
    }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    new AppController();
});
