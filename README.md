# Adaptive Theme Engine

An enterprise-grade, browser-based design system generator that uses artificial intelligence and perceptual color math to instantly build complete, WCAG-accessible themes directly from an organization's logo.

## Features

- 🧠 **On-Device AI OCR:** Automatically extracts organization names and smartly crops out wordmarks and text using `tesseract.js` entirely in the browser.
- 🎨 **K-Means Clustering:** Employs an unsupervised machine learning algorithm (k=5) to cluster pixels and extract the true mathematical primary, secondary, and neutral brand colors, ignoring gradients and anti-aliasing noise.
- 📐 **Oklab Perceptual Math:** Generates beautiful 50-900 color palettes in the Oklab color space, ensuring flawless perceptual lightness across all shades.
- 👓 **Contrast-Aware Shadows & WCAG:** Automatically calculates background luminance to inject dynamic CSS text shadows and strictly enforces 4.5:1 WCAG text contrast ratios.
- 🎛️ **Real-Time Tweaking:** Manually override the AI's extracted base colors and watch the engine instantly recalculate the entire scale and update the UI.
- 📦 **Export Ready:** One-click export for raw CSS variables and a fully configured `tailwind.config.js` to drop directly into your project.

## How to Run Locally

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the development server:
   ```bash
   npm run dev
   ```

## Architecture

This is a pure TypeScript Vanilla architecture focused on zero-latency processing. It avoids server-side processing for images, relying exclusively on Canvas APIs and local WebAssembly models to guarantee privacy and speed
