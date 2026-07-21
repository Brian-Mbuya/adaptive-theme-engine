import { ColorUtils } from '../util/ColorUtils';
import type { Color } from '../model/Theme';

/**
 * Extracts dominant brand colors from a logo image using
 * K-Means++ clustering in Oklab perceptual color space.
 *
 * Inspired by Adobe Leonardo's perceptual approach and
 * auto-palette's WASM clustering accuracy.
 */
export class ColorExtractor {

    /**
     * Extract primary, secondary, and neutral colors from an image.
     * Uses deterministic K-Means++ in Oklab space.
     */
    public async extractColors(imageSrc: string): Promise<{ primary: Color; secondary: Color; neutral: Color }> {
        const img = await this.loadImage(imageSrc);
        const pixels = this.getFilteredPixels(img);

        if (pixels.length < 3) {
            return this.getDefaultColors();
        }

        // Convert pixels to Oklab for perceptually meaningful clustering
        const oklabPixels = pixels.map(([r, g, b]) => ColorUtils.rgbToOklab(r, g, b));

        // 1. K-Means++ with deterministic seed
        const K = Math.min(6, oklabPixels.length);
        const { centroids: rawCentroids, assignments: rawAssignments } = this.kMeansPlusPlus(oklabPixels, K);

        // Count initial cluster membership
        const rawCounts = new Array(K).fill(0);
        for (const a of rawAssignments) {
            rawCounts[a]++;
        }

        // 2. Perceptual Dedup: Merge clusters with Oklab ΔE < 0.02 (distSq < 0.0004)
        const clusters: { oklab: [number, number, number]; rgb: [number, number, number]; count: number; score: number }[] = [];
        for (let i = 0; i < K; i++) {
            if (rawCounts[i] === 0) continue;
            const oklab = rawCentroids[i];
            const rgb = ColorUtils.oklabToRgb(oklab[0], oklab[1], oklab[2]) as [number, number, number];
            let merged = false;

            for (const existing of clusters) {
                if (ColorUtils.oklabDistanceSq(existing.oklab, oklab) < 0.0004) {
                    existing.count += rawCounts[i];
                    merged = true;
                    break;
                }
            }

            if (!merged) {
                const [, chroma] = ColorUtils.rgbToOklch(rgb[0], rgb[1], rgb[2]);
                // Chroma-weighted role scoring: score = chroma * ln(1 + pixelCount)
                const score = chroma * Math.log(1 + rawCounts[i]);
                clusters.push({ oklab, rgb, count: rawCounts[i], score });
            }
        }

        if (clusters.length === 0) return this.getDefaultColors();

        // Sort by Chroma-Weighted Score descending (vivid brand marks beat large dull fields)
        clusters.sort((a, b) => b.score - a.score);

        // --- Assign roles ---

        // Primary: highest chroma-weighted score cluster
        let primaryCluster = clusters[0];
        const primary = ColorUtils.createColor(primaryCluster.rgb);

        // Secondary: next highest score cluster with sufficient contrast from primary
        let secondaryRgb = primaryCluster.rgb;
        for (let i = 1; i < clusters.length; i++) {
            const c = clusters[i];
            const contrast = ColorUtils.getContrastRatio(primaryCluster.rgb, c.rgb);
            if (contrast > 1.5) {
                secondaryRgb = c.rgb;
                break;
            }
        }
        const secondary = ColorUtils.createColor(secondaryRgb);

        // Neutral: lowest saturation cluster
        let neutralRgb: [number, number, number] = clusters[0].rgb;
        let minSat = Infinity;
        for (const c of clusters) {
            const hsl = ColorUtils.rgbToHsl(c.rgb[0], c.rgb[1], c.rgb[2]);
            if (hsl[1] < minSat) {
                minSat = hsl[1];
                neutralRgb = c.rgb;
            }
        }

        // If everything is saturated, synthesize a neutral from primary's hue
        if (minSat > 25) {
            const primaryHsl = ColorUtils.rgbToHsl(primaryCluster.rgb[0], primaryCluster.rgb[1], primaryCluster.rgb[2]);
            neutralRgb = ColorUtils.hslToRgb(primaryHsl[0], 8, 50);
        }
        const neutral = ColorUtils.createColor(neutralRgb);

        return { primary, secondary, neutral };
    }

    // ─── Image Loading ───────────────────────────────────────

    private loadImage(src: string): Promise<HTMLImageElement> {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.crossOrigin = 'anonymous';
            img.onload = () => resolve(img);
            img.onerror = () => reject(new Error('Failed to load image for color extraction'));
            img.src = src;
        });
    }

    // ─── Pixel Extraction ────────────────────────────────────

    private getFilteredPixels(img: HTMLImageElement): [number, number, number][] {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (!ctx) throw new Error('Canvas 2D context not available');

        // Scale down for performance, but keep enough detail
        const MAX_SIZE = 150;
        let width = img.width;
        let height = img.height;

        if (width > MAX_SIZE || height > MAX_SIZE) {
            const ratio = Math.min(MAX_SIZE / width, MAX_SIZE / height);
            width = Math.floor(width * ratio);
            height = Math.floor(height * ratio);
        }
        if (width === 0 || height === 0) {
            width = 100;
            height = 100;
        }

        canvas.width = width;
        canvas.height = height;
        const imageData = ctx.getImageData(0, 0, width, height).data;

        // Sample 4 corners for background voting
        const cornerCoords = [
            [0, 0],
            [width - 1, 0],
            [0, height - 1],
            [width - 1, height - 1]
        ];

        const cornerOklabs: [number, number, number][] = [];
        for (const [cx, cy] of cornerCoords) {
            const idx = (cy * width + cx) * 4;
            const ca = imageData[idx + 3];
            if (ca >= 128) {
                const cr = imageData[idx];
                const cg = imageData[idx + 1];
                const cb = imageData[idx + 2];
                cornerOklabs.push(ColorUtils.rgbToOklab(cr, cg, cb));
            }
        }

        // Average corner Oklab (background field color)
        let bgOklab: [number, number, number] | null = null;
        if (cornerOklabs.length >= 2) {
            const sumL = cornerOklabs.reduce((acc, cur) => acc + cur[0], 0);
            const suma = cornerOklabs.reduce((acc, cur) => acc + cur[1], 0);
            const sumb = cornerOklabs.reduce((acc, cur) => acc + cur[2], 0);
            bgOklab = [sumL / cornerOklabs.length, suma / cornerOklabs.length, sumb / cornerOklabs.length];
        }

        const pixels: [number, number, number][] = [];

        for (let i = 0; i < imageData.length; i += 4) {
            const r = imageData[i];
            const g = imageData[i + 1];
            const b = imageData[i + 2];
            const a = imageData[i + 3];

            // Skip transparent pixels
            if (a < 128) continue;
            // Skip near-white
            if (r > 245 && g > 245 && b > 245) continue;
            // Skip near-black
            if (r < 10 && g < 10 && b < 10) continue;

            // Corner-vote background exclusion (skip pixels matching background color field)
            if (bgOklab) {
                const pixOklab = ColorUtils.rgbToOklab(r, g, b);
                if (ColorUtils.oklabDistanceSq(pixOklab, bgOklab) < 0.0025) {
                    continue;
                }
            }

            pixels.push([r, g, b]);
        }

        return pixels;
    }

    // ─── K-Means++ in Oklab Space ────────────────────────────

    private kMeansPlusPlus(
        points: [number, number, number][],
        K: number,
        seed: number = 42
    ): { centroids: [number, number, number][]; assignments: number[] } {
        const rng = ColorUtils.createSeededRng(seed);
        const N = points.length;

        // --- K-Means++ Initialization ---
        const centroids: [number, number, number][] = [];

        // Pick first centroid randomly
        centroids.push([...points[Math.floor(rng() * N)]] as [number, number, number]);

        // Pick remaining centroids proportional to D²
        for (let c = 1; c < K; c++) {
            const distances = points.map(p => {
                let minDist = Infinity;
                for (const centroid of centroids) {
                    const d = ColorUtils.oklabDistanceSq(p, centroid);
                    if (d < minDist) minDist = d;
                }
                return minDist;
            });

            const totalDist = distances.reduce((sum, d) => sum + d, 0);
            let threshold = rng() * totalDist;
            let chosen = 0;

            for (let i = 0; i < N; i++) {
                threshold -= distances[i];
                if (threshold <= 0) {
                    chosen = i;
                    break;
                }
            }

            centroids.push([...points[chosen]] as [number, number, number]);
        }

        // --- Iterative Assignment & Update ---
        const assignments = new Array(N).fill(0);
        const MAX_ITER = 30;
        const EPSILON = 0.0001; // Convergence threshold

        for (let iter = 0; iter < MAX_ITER; iter++) {
            // Assign each point to nearest centroid
            for (let i = 0; i < N; i++) {
                let minDist = Infinity;
                let best = 0;
                for (let c = 0; c < K; c++) {
                    const d = ColorUtils.oklabDistanceSq(points[i], centroids[c]);
                    if (d < minDist) {
                        minDist = d;
                        best = c;
                    }
                }
                assignments[i] = best;
            }

            // Recompute centroids
            const sums = Array.from({ length: K }, () => [0, 0, 0]);
            const counts = new Array(K).fill(0);

            for (let i = 0; i < N; i++) {
                const c = assignments[i];
                sums[c][0] += points[i][0];
                sums[c][1] += points[i][1];
                sums[c][2] += points[i][2];
                counts[c]++;
            }

            let maxShift = 0;
            for (let c = 0; c < K; c++) {
                if (counts[c] === 0) continue;
                const newCentroid: [number, number, number] = [
                    sums[c][0] / counts[c],
                    sums[c][1] / counts[c],
                    sums[c][2] / counts[c],
                ];
                const shift = ColorUtils.oklabDistanceSq(centroids[c], newCentroid);
                if (shift > maxShift) maxShift = shift;
                centroids[c] = newCentroid;
            }

            // Converged?
            if (maxShift < EPSILON) break;
        }

        return { centroids, assignments };
    }

    // ─── Fallback ────────────────────────────────────────────

    private getDefaultColors() {
        return {
            primary: ColorUtils.createColor([59, 130, 246]),
            secondary: ColorUtils.createColor([100, 116, 139]),
            neutral: ColorUtils.createColor([148, 163, 184]),
        };
    }
}
