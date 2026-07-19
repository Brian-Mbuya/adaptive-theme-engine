import { ColorUtils } from '../util/ColorUtils';
import type { Color } from '../model/Theme';

export class ColorExtractor {
    public async extractColors(imageSrc: string): Promise<{ primary: Color, secondary: Color, neutral: Color }> {
        return new Promise((resolve) => {
            const img = new Image();
            img.onload = () => {
                try {
                    const canvas = document.createElement('canvas');
                    const ctx = canvas.getContext('2d');
                    if (!ctx) throw new Error("Canvas 2D context not available");

                    // Scale down for faster processing
                    const MAX_SIZE = 100;
                    let width = img.width;
                    let height = img.height;
                    
                    if (width > MAX_SIZE || height > MAX_SIZE) {
                        const ratio = Math.min(MAX_SIZE / width, MAX_SIZE / height);
                        width = Math.floor(width * ratio);
                        height = Math.floor(height * ratio);
                    } else if (width === 0 || height === 0) {
                        width = 100; height = 100;
                    }

                    canvas.width = width;
                    canvas.height = height;
                    ctx.drawImage(img, 0, 0, width, height);

                    const imageData = ctx.getImageData(0, 0, width, height).data;
                    // Collect all valid pixels
                    const pixels: [number, number, number][] = [];
                    for (let i = 0; i < imageData.length; i += 4) {
                        const r = imageData[i];
                        const g = imageData[i + 1];
                        const b = imageData[i + 2];
                        const a = imageData[i + 3];

                        if (a < 128) continue;
                        if (r > 240 && g > 240 && b > 240) continue;
                        if (r < 15 && g < 15 && b < 15) continue;
                        pixels.push([r, g, b]);
                    }

                    // K-Means Clustering (K=5)
                    const k = Math.min(5, pixels.length);
                    let centroids: [number, number, number][] = [];
                    
                    // Initialize centroids randomly from pixels
                    for (let i = 0; i < k; i++) {
                        centroids.push(pixels[Math.floor(Math.random() * pixels.length)] || [128, 128, 128]);
                    }

                    const assignments = new Array(pixels.length).fill(0);
                    const iterations = 5;

                    for (let iter = 0; iter < iterations; iter++) {
                        // Assign pixels to closest centroid
                        for (let i = 0; i < pixels.length; i++) {
                            let minDist = Infinity;
                            let bestCluster = 0;
                            const [pr, pg, pb] = pixels[i];
                            for (let c = 0; c < k; c++) {
                                const [cr, cg, cb] = centroids[c];
                                // Fast Euclidean distance squared
                                const dist = (pr-cr)*(pr-cr) + (pg-cg)*(pg-cg) + (pb-cb)*(pb-cb);
                                if (dist < minDist) {
                                    minDist = dist;
                                    bestCluster = c;
                                }
                            }
                            assignments[i] = bestCluster;
                        }

                        // Recalculate centroids
                        const sums = Array(k).fill(0).map(() => [0, 0, 0]);
                        const counts = Array(k).fill(0);
                        
                        for (let i = 0; i < pixels.length; i++) {
                            const cluster = assignments[i];
                            sums[cluster][0] += pixels[i][0];
                            sums[cluster][1] += pixels[i][1];
                            sums[cluster][2] += pixels[i][2];
                            counts[cluster]++;
                        }

                        for (let c = 0; c < k; c++) {
                            if (counts[c] > 0) {
                                centroids[c] = [
                                    Math.round(sums[c][0] / counts[c]),
                                    Math.round(sums[c][1] / counts[c]),
                                    Math.round(sums[c][2] / counts[c])
                                ];
                            }
                        }
                    }

                    // Count final cluster sizes
                    const clusterCounts = Array(k).fill(0);
                    for (let i = 0; i < pixels.length; i++) {
                        clusterCounts[assignments[i]]++;
                    }

                    // Sort centroids by frequency
                    const sortedClusters = centroids
                        .map((rgb, index) => ({ rgb, count: clusterCounts[index] }))
                        .sort((a, b) => b.count - a.count);

                    let dominantRgb: [number, number, number] = [59, 130, 246];
                    if (sortedClusters.length > 0 && sortedClusters[0].count > 0) {
                        dominantRgb = sortedClusters[0].rgb;
                    }

                    const primary: Color = this.createColorObj(dominantRgb);
                    
                    // Find secondary (must have some contrast with primary)
                    let secondaryRgb: [number, number, number] = dominantRgb;
                    for (let i = 1; i < sortedClusters.length; i++) {
                        if (sortedClusters[i].count === 0) continue;
                        const contrast = ColorUtils.getContrastRatio(dominantRgb, sortedClusters[i].rgb);
                        if (contrast > 1.3) {
                            secondaryRgb = sortedClusters[i].rgb;
                            break;
                        }
                    }
                    const secondary: Color = this.createColorObj(secondaryRgb);

                    // Find neutral (lowest saturation)
                    let neutralRgb: [number, number, number] = sortedClusters.length > 0 ? sortedClusters[0].rgb : [128, 128, 128];
                    let minSaturation = 100;
                    for (let i = 0; i < sortedClusters.length; i++) {
                        if (sortedClusters[i].count === 0) continue;
                        const hsl = ColorUtils.rgbToHsl(sortedClusters[i].rgb[0], sortedClusters[i].rgb[1], sortedClusters[i].rgb[2]);
                        if (hsl[1] < minSaturation) {
                            minSaturation = hsl[1];
                            neutralRgb = sortedClusters[i].rgb;
                        }
                    }

                    // If still too saturated, synthesize one
                    if (minSaturation > 30) {
                        const primaryHsl = ColorUtils.rgbToHsl(dominantRgb[0], dominantRgb[1], dominantRgb[2]);
                        neutralRgb = ColorUtils.hslToRgb(primaryHsl[0], 10, 50);
                    }
                    const neutral: Color = this.createColorObj(neutralRgb);

                    resolve({ primary, secondary, neutral });

                } catch (err) {
                    console.error("Canvas extraction error:", err);
                    resolve(this.getDefaultColors());
                }
            };
            img.onerror = () => {
                console.error("Image load error for extraction");
                resolve(this.getDefaultColors());
            };
            img.src = imageSrc;
        });
    }

    private getDefaultColors() {
        return {
            primary: this.createColorObj([59, 130, 246]),
            secondary: this.createColorObj([100, 116, 139]),
            neutral: this.createColorObj([241, 245, 249])
        };
    }

    private createColorObj(rgbArray: [number, number, number]): Color {
        return {
            rgb: rgbArray,
            hex: ColorUtils.rgbToHex(rgbArray[0], rgbArray[1], rgbArray[2]),
            hsl: ColorUtils.rgbToHsl(rgbArray[0], rgbArray[1], rgbArray[2])
        };
    }
}
