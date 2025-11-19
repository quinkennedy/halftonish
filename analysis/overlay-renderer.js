/**
 * Overlay Renderer
 * Generates red/green overlay visualization for darkness analysis
 */

/**
 * Generate overlay canvas from darkness analysis results
 * @param {Float32Array} darknessMap - Darkness values for each sample
 * @param {number} samplesWide - Number of samples horizontally
 * @param {number} samplesHigh - Number of samples vertically
 * @param {number} stride - Stride between samples
 * @param {number} width - Original image width
 * @param {number} height - Original image height
 * @param {number} upperThreshold - Upper darkness threshold
 * @param {number} lowerThreshold - Lower darkness threshold
 * @returns {HTMLCanvasElement} Canvas with overlay
 */
export function generateOverlay(darknessMap, samplesWide, samplesHigh, stride, width, height, upperThreshold, lowerThreshold) {
    // Create overlay canvas
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');

    // Create image data for overlay
    const overlayData = ctx.createImageData(width, height);

    // Fill overlay based on darkness map
    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            // Map pixel coordinates to sample coordinates
            const sx = Math.floor(x / stride);
            const sy = Math.floor(y / stride);

            // Bounds check
            if (sx >= samplesWide || sy >= samplesHigh) {
                continue;
            }

            const sampleIndex = sy * samplesWide + sx;
            const darkness = darknessMap[sampleIndex];

            const pixelIndex = (y * width + x) * 4;

            // Determine overlay color
            if (darkness > upperThreshold) {
                // Too dark - red overlay
                const intensity = Math.min(1, (darkness - upperThreshold) / (1 - upperThreshold));
                overlayData.data[pixelIndex] = 255;         // R
                overlayData.data[pixelIndex + 1] = 0;       // G
                overlayData.data[pixelIndex + 2] = 0;       // B
                overlayData.data[pixelIndex + 3] = Math.floor(intensity * 128); // A (50% max)
            } else if (darkness < lowerThreshold) {
                // Too light - green overlay
                const intensity = Math.min(1, (lowerThreshold - darkness) / lowerThreshold);
                overlayData.data[pixelIndex] = 0;           // R
                overlayData.data[pixelIndex + 1] = 255;     // G
                overlayData.data[pixelIndex + 2] = 0;       // B
                overlayData.data[pixelIndex + 3] = Math.floor(intensity * 128); // A
            } else {
                // Balanced - transparent
                overlayData.data[pixelIndex + 3] = 0;
            }
        }
    }

    ctx.putImageData(overlayData, 0, 0);
    return canvas;
}

/**
 * Composite overlay onto base canvas
 * @param {HTMLCanvasElement} baseCanvas - Base pattern canvas
 * @param {HTMLCanvasElement} overlayCanvas - Overlay canvas
 * @returns {HTMLCanvasElement} New canvas with composited result
 */
export function compositeOverlay(baseCanvas, overlayCanvas) {
    const canvas = document.createElement('canvas');
    canvas.width = baseCanvas.width;
    canvas.height = baseCanvas.height;
    const ctx = canvas.getContext('2d');

    // Draw base pattern
    ctx.drawImage(baseCanvas, 0, 0);

    // Draw overlay on top
    ctx.drawImage(overlayCanvas, 0, 0);

    return canvas;
}

/**
 * Format statistics for display
 * @param {Object} stats - Analysis statistics
 * @returns {string} Formatted HTML string
 */
export function formatStats(stats) {
    return `
        <div class="stat-item">
            <span class="stat-label">Mean Darkness:</span>
            <span class="stat-value">${(stats.meanDarkness * 100).toFixed(1)}%</span>
        </div>
        <div class="stat-item">
            <span class="stat-label stat-too-dark">Too Dark:</span>
            <span class="stat-value">${stats.percentTooDark.toFixed(1)}%</span>
        </div>
        <div class="stat-item">
            <span class="stat-label stat-too-light">Too Light:</span>
            <span class="stat-value">${stats.percentTooLight.toFixed(1)}%</span>
        </div>
        <div class="stat-item">
            <span class="stat-label stat-balanced">Balanced:</span>
            <span class="stat-value">${stats.percentBalanced.toFixed(1)}%</span>
        </div>
    `;
}
