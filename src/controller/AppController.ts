import { ThemeEngine } from '../service/ThemeEngine';
import { LogoProcessor } from '../extractor/LogoProcessor';
import { ExportPanel } from '../ui/ExportPanel';
import type { ThemeStyle, Theme } from '../model/Theme';

class AppController {
    private engine: ThemeEngine;
    private logoSrc: string | null = null;
    private currentTheme: Theme | null = null;

    // UI Elements
    private dropZone = document.getElementById('drop-zone') as HTMLDivElement;
    private logoInput = document.getElementById('logo-input') as HTMLInputElement;
    private logoPreview = document.getElementById('logo-preview') as HTMLImageElement;
    private uploadText = document.getElementById('upload-text') as HTMLParagraphElement;
    
    private orgNameInput = document.getElementById('org-name') as HTMLInputElement;
    private themeStyleSelect = document.getElementById('theme-style') as HTMLSelectElement;
    private generateBtn = document.getElementById('generate-btn') as HTMLButtonElement;
    private exportBtn = document.getElementById('export-btn') as HTMLButtonElement;
    
    private previewBrand = document.getElementById('preview-brand') as HTMLDivElement;

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

        // Generate button click
        this.generateBtn.addEventListener('click', async () => {
            if (!this.logoSrc) return;

            const originalText = this.generateBtn.textContent;
            this.generateBtn.textContent = 'Generating Theme & Reading Logo...';
            this.generateBtn.disabled = true;

            try {
                // 1. Process Logo (OCR & Cropping)
                const { orgName: extractedName, croppedImageSrc } = await LogoProcessor.processLogo(this.logoSrc);
                
                let orgName = this.orgNameInput.value.trim();
                
                // Auto-fill from OCR if empty
                if (!orgName && extractedName) {
                    orgName = extractedName;
                    this.orgNameInput.value = orgName;
                    this.previewBrand.textContent = orgName;
                }

                const style = this.themeStyleSelect.value as ThemeStyle;

                // Grab overrides if they were set (for manual tweak regeneration)
                const tweakPrimary = document.getElementById('tweak-primary') as HTMLInputElement;
                const tweakSecondary = document.getElementById('tweak-secondary') as HTMLInputElement;
                const tweakNeutral = document.getElementById('tweak-neutral') as HTMLInputElement;

                let overrides = undefined;
                if (tweakPrimary.value !== '#000000' || tweakSecondary.value !== '#000000' || tweakNeutral.value !== '#000000') {
                    // Only use overrides if the tweaks panel is visible
                    const tweaksPanel = document.getElementById('theme-tweaks');
                    if (tweaksPanel && tweaksPanel.style.display === 'block') {
                        overrides = {
                            primary: tweakPrimary.value,
                            secondary: tweakSecondary.value,
                            neutral: tweakNeutral.value
                        };
                    }
                }

                const theme = await this.engine.generateTheme(croppedImageSrc, orgName || 'Acme Corp', style, overrides);
                this.currentTheme = theme;
                this.exportBtn.disabled = false;
                this.engine.applyTheme(theme);
                
                // Update preview logo
                const previewLogo = document.getElementById('preview-logo') as HTMLImageElement;
                previewLogo.src = croppedImageSrc;
                previewLogo.style.display = 'block';

                // Update tweak swatches
                tweakPrimary.value = theme.colors.primary;
                tweakSecondary.value = theme.colors.secondary;
                tweakNeutral.value = theme.colors.neutralScale[500];
                const themeTweaks = document.getElementById('theme-tweaks') as HTMLElement;
                themeTweaks.style.display = 'block';

            } catch (error: any) {
                console.error('Error generating theme:', error);
                alert('Failed to generate theme from logo. Error: ' + (error.message || error));
            } finally {
                this.generateBtn.textContent = originalText;
                this.generateBtn.disabled = false;
            }
        });
        
        // Listen for tweak changes to instantly regenerate
        const tweakInputs = ['tweak-primary', 'tweak-secondary', 'tweak-neutral'];
        tweakInputs.forEach(id => {
            const input = document.getElementById(id) as HTMLInputElement;
            if (input) {
                input.addEventListener('input', () => {
                    // Debounce or just trigger generate directly
                    if (this.logoSrc) this.generateBtn.click();
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
            }
        };
        reader.readAsDataURL(file);
    }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    new AppController();
});
