import Tesseract from 'tesseract.js';

export class LogoProcessor {
    public static async processLogo(imageSrc: string): Promise<{ orgName: string | null, croppedImageSrc: string }> {
        return new Promise(async (resolve) => {
            try {
                const result = await Tesseract.recognize(imageSrc, 'eng');
                
                const data: any = result.data;
                const words: any[] = data.words;
                if (!words || words.length === 0) {
                    resolve({ orgName: null, croppedImageSrc: imageSrc });
                    return;
                }

                // Filter out tiny artifacts that aren't real words (e.g., confidence < 60)
                const validWords = words.filter((w: any) => w.confidence > 60 && w.text.length > 1);
                
                if (validWords.length === 0) {
                     resolve({ orgName: null, croppedImageSrc: imageSrc });
                     return;
                }

                const orgName = validWords.map((w: any) => w.text).join(' ').trim();

                let minX = Infinity, minY = Infinity, maxX = 0, maxY = 0;
                for (const word of validWords) {
                    const box = word.bbox;
                    if (box.x0 < minX) minX = box.x0;
                    if (box.y0 < minY) minY = box.y0;
                    if (box.x1 > maxX) maxX = box.x1;
                    if (box.y1 > maxY) maxY = box.y1;
                }

                const img = new Image();
                img.onload = () => {
                    const canvas = document.createElement('canvas');
                    const ctx = canvas.getContext('2d');
                    if (!ctx) {
                        resolve({ orgName, croppedImageSrc: imageSrc });
                        return;
                    }

                    const w = img.width;
                    const h = img.height;
                    
                    let cropW = w;
                    let cropH = h;
                    let cropY = 0;

                    // Side-by-side wordmark: Text is all on the right side
                    if (minX > w * 0.4) {
                        cropW = Math.max(10, minX - 10);
                    } 
                    // Lower label
                    else if (minY > h * 0.6) {
                        cropH = Math.max(10, minY - 10); 
                    } 
                    // Upper label
                    else if (maxY < h * 0.4) {
                        cropY = Math.min(h - 10, maxY + 10);
                        cropH = h - cropY;
                    } else {
                        // Text covers middle, can't safely crop
                        resolve({ orgName, croppedImageSrc: imageSrc });
                        return;
                    }

                    canvas.width = cropW;
                    canvas.height = cropH;
                    // drawImage(image, sx, sy, sWidth, sHeight, dx, dy, dWidth, dHeight)
                    ctx.drawImage(img, 0, cropY, cropW, cropH, 0, 0, cropW, cropH);
                    
                    const croppedImageSrc = canvas.toDataURL('image/png');
                    resolve({ orgName, croppedImageSrc });
                };
                img.onerror = () => {
                    resolve({ orgName, croppedImageSrc: imageSrc });
                };
                img.src = imageSrc;

            } catch (error) {
                console.error("OCR Error:", error);
                resolve({ orgName: null, croppedImageSrc: imageSrc });
            }
        });
    }
}
