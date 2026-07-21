import type TesseractType from 'tesseract.js';

/**
 * Handles logo processing: OCR extraction of the organization name
 * and smart cropping of text elements.
 */
export class LogoProcessor {
    /**
     * Processes a logo to extract the organization name via OCR
     * and returns a cropped version of the image prioritizing the icon mark.
     */
    public static async processLogo(imageSrc: string): Promise<{ orgName: string | null; croppedImageSrc: string }> {
        try {
            // Dynamic import to prevent Tesseract bundling in core engine library build
            const tesseractModule = await import('tesseract.js');
            const Tesseract = tesseractModule.default || tesseractModule;

            // 1. Perform OCR
            const result = await Tesseract.recognize(imageSrc, 'eng');
            const data: any = result.data;
            const words: any[] = data.words;

            if (!words || words.length === 0) {
                return { orgName: null, croppedImageSrc: imageSrc };
            }

            // Filter out tiny artifacts (confidence > 60, length > 1)
            const validWords = words.filter((w: any) => w.confidence > 60 && w.text.length > 1);

            if (validWords.length === 0) {
                return { orgName: null, croppedImageSrc: imageSrc };
            }

            const orgName = validWords.map((w: any) => w.text).join(' ').trim();

            // Find bounding box for all valid text
            let minX = Infinity, minY = Infinity, maxY = 0;
            for (const word of validWords) {
                const box = word.bbox;
                if (box.x0 < minX) minX = box.x0;
                if (box.y0 < minY) minY = box.y0;
                if (box.y1 > maxY) maxY = box.y1;
            }

            // 2. Crop Image via Canvas
            const croppedImageSrc = await this.cropImage(imageSrc, minX, minY, maxY);
            return { orgName, croppedImageSrc };

        } catch (error) {
            console.error("OCR Error:", error);
            // Gracefully degrade
            return { orgName: null, croppedImageSrc: imageSrc };
        }
    }

    /**
     * Helper to load and crop the image, returning a DataURL.
     */
    private static cropImage(imageSrc: string, minX: number, minY: number, maxY: number): Promise<string> {
        return new Promise((resolve) => {
            const img = new Image();
            img.crossOrigin = 'anonymous';

            img.onload = () => {
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');
                if (!ctx) {
                    resolve(imageSrc);
                    return;
                }

                const w = img.width;
                const h = img.height;

                let cropW = w;
                let cropH = h;
                let cropY = 0;

                // Simple heuristic cropping based on text location
                if (minX > w * 0.4) {
                    // Side-by-side wordmark: Text is all on the right side
                    cropW = Math.max(10, minX - 10);
                } else if (minY > h * 0.6) {
                    // Lower label
                    cropH = Math.max(10, minY - 10);
                } else if (maxY < h * 0.4) {
                    // Upper label
                    cropY = Math.min(h - 10, maxY + 10);
                    cropH = h - cropY;
                } else {
                    // Text covers middle, can't safely crop
                    resolve(imageSrc);
                    return;
                }

                // Enforce minimum crop area (must be at least 25% of original width and height)
                if (cropW < w * 0.25 || cropH < h * 0.25) {
                    resolve(imageSrc);
                    return;
                }

                canvas.width = cropW;
                canvas.height = cropH;
                ctx.drawImage(img, 0, cropY, cropW, cropH, 0, 0, cropW, cropH);

                resolve(canvas.toDataURL('image/png'));
            };

            img.onerror = () => resolve(imageSrc); // Fallback to original on error
            img.src = imageSrc;
        });
    }
}
