/**
 * Darkness Analysis Web Worker
 * Analyzes local pixel density in pattern images to identify too-dark or too-light regions
 */

let cancelRequested = false;

self.addEventListener('message', async (e) => {
    const { type, imageData, config } = e.data;

    if (type === 'analyze') {
        cancelRequested = false;
        try {
            await analyzeDarkness(imageData, config);
        } catch (error) {
            if (error.message === 'Cancelled') {
                self.postMessage({ type: 'cancelled' });
            } else {
                self.postMessage({
                    type: 'error',
                    message: error.message
                });
            }
        }
    } else if (type === 'cancel') {
        cancelRequested = true;
    }
});

/**
 * Analyze darkness distribution in image
 * @param {ImageData} imageData - Image to analyze
 * @param {Object} config - Analysis configuration
 * @param {number} config.radiusPixels - Radius for circular sampling region
 * @param {number} config.upperThreshold - Upper darkness threshold (0-1)
 * @param {number} config.lowerThreshold - Lower darkness threshold (0-1)
 */
async function analyzeDarkness(imageData, config) {
    const { width, height } = imageData;
    const data = imageData.data;
    const radius = Math.round(config.radiusPixels);

    // Create darkness map (one value per sample point)
    // Sample stride for performance - don't analyze every single pixel
    const stride = Math.max(1, Math.floor(radius / 4));
    const samplesWide = Math.ceil(width / stride);
    const samplesHigh = Math.ceil(height / stride);
    const darknessMap = new Float32Array(samplesWide * samplesHigh);

    // Statistics
    let stats = {
        tooDark: 0,
        tooLight: 0,
        balanced: 0,
        totalDarkness: 0,
        sampleCount: 0
    };

    const totalSamples = samplesWide * samplesHigh;
    const progressInterval = Math.max(1, Math.floor(totalSamples / 100)); // Update progress 100 times

    // Pre-calculate circular mask for efficiency
    const maskRadius = Math.ceil(radius);
    const mask = createCircularMask(maskRadius);

    // Analyze samples
    for (let sy = 0; sy < samplesHigh; sy++) {
        for (let sx = 0; sx < samplesWide; sx++) {
            // Check cancellation
            if (cancelRequested) {
                throw new Error('Cancelled');
            }

            const sampleIndex = sy * samplesWide + sx;

            // Map sample coordinates back to image coordinates
            const cx = sx * stride;
            const cy = sy * stride;

            // Calculate local darkness
            const darkness = calculateLocalDarkness(data, width, height, cx, cy, radius, mask);

            // Store in map
            darknessMap[sampleIndex] = darkness;

            // Update stats
            stats.totalDarkness += darkness;
            stats.sampleCount++;

            if (darkness > config.upperThreshold) {
                stats.tooDark++;
            } else if (darkness < config.lowerThreshold) {
                stats.tooLight++;
            } else {
                stats.balanced++;
            }

            // Send progress updates
            if (sampleIndex % progressInterval === 0) {
                self.postMessage({
                    type: 'progress',
                    progress: sampleIndex / totalSamples
                });
            }
        }
    }

    // Calculate final statistics
    const finalStats = {
        meanDarkness: stats.totalDarkness / stats.sampleCount,
        tooDarkPixels: stats.tooDark,
        tooLightPixels: stats.tooLight,
        balancedPixels: stats.balanced,
        percentTooDark: (stats.tooDark / stats.sampleCount) * 100,
        percentTooLight: (stats.tooLight / stats.sampleCount) * 100,
        percentBalanced: (stats.balanced / stats.sampleCount) * 100
    };

    // Send completed result
    // Note: We can't transfer darknessMap as it needs to be used for overlay generation
    self.postMessage({
        type: 'complete',
        darknessMap: darknessMap,
        stats: finalStats,
        stride: stride,
        samplesWide: samplesWide,
        samplesHigh: samplesHigh
    });
}

/**
 * Create circular mask for sampling
 * @param {number} radius - Mask radius
 * @returns {Array<{dx: number, dy: number}>} List of offsets within circle
 */
function createCircularMask(radius) {
    const mask = [];
    const radiusSq = radius * radius;

    for (let dy = -radius; dy <= radius; dy++) {
        for (let dx = -radius; dx <= radius; dx++) {
            if (dx * dx + dy * dy <= radiusSq) {
                mask.push({ dx, dy });
            }
        }
    }

    return mask;
}

/**
 * Calculate local darkness in circular region around point
 * @param {Uint8ClampedArray} data - Image pixel data
 * @param {number} width - Image width
 * @param {number} height - Image height
 * @param {number} cx - Center x coordinate
 * @param {number} cy - Center y coordinate
 * @param {number} radius - Sampling radius
 * @param {Array} mask - Pre-calculated circular mask
 * @returns {number} Darkness ratio (0 = all light, 1 = all dark)
 */
function calculateLocalDarkness(data, width, height, cx, cy, radius, mask) {
    let darkCount = 0;
    let totalCount = 0;

    // Use pre-calculated mask for efficiency
    for (const { dx, dy } of mask) {
        const x = cx + dx;
        const y = cy + dy;

        // Bounds check
        if (x < 0 || x >= width || y < 0 || y >= height) {
            continue;
        }

        const idx = (y * width + x) * 4;
        const gray = data[idx]; // R channel (grayscale)

        totalCount++;
        if (gray < 128) {
            darkCount++;
        }
    }

    return totalCount > 0 ? darkCount / totalCount : 0;
}
