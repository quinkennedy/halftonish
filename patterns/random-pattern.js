/**
 * Random Pattern Generator
 * Generates pure random noise with configurable distribution
 */

import { SeededRandom } from '../utils/prng.js';

/**
 * Generate random pattern
 * @param {number} width - Width in pixels
 * @param {number} height - Height in pixels
 * @param {Object} params - Pattern parameters
 * @param {string} params.distribution - 'uniform', 'normal', or 'binary'
 * @param {number} [params.seed] - Optional seed for reproducibility
 * @param {Function} onProgress - Progress callback (0-1)
 * @param {Object} cancelToken - Cancellation token {cancelled: boolean}
 * @returns {ImageData} Generated pattern
 */
export function generateRandomPattern(width, height, params, onProgress, cancelToken) {
    const { distribution = 'uniform', seed } = params;

    // Create ImageData
    const imageData = new ImageData(width, height);
    const data = imageData.data;

    // Create random number generator
    const rng = seed !== undefined ? new SeededRandom(seed) : new SeededRandom();

    // Process in chunks for progress updates
    const totalPixels = width * height;
    const chunkSize = 10000; // pixels per progress update
    let pixelCount = 0;

    for (let i = 0; i < data.length; i += 4) {
        // Check for cancellation
        if (cancelToken && cancelToken.cancelled) {
            throw new Error('Generation cancelled');
        }

        // Generate random value based on distribution
        let value;

        if (distribution === 'binary') {
            // Pure black or white
            value = rng.next() < 0.5 ? 0 : 255;
        } else if (distribution === 'normal') {
            // Gaussian distribution centered at 128
            const gaussian = rng.nextGaussian(128, 50);
            value = Math.max(0, Math.min(255, Math.round(gaussian)));
        } else {
            // Uniform distribution (default)
            value = Math.floor(rng.next() * 256);
        }

        // Set RGB to same value (grayscale)
        data[i] = value;     // R
        data[i + 1] = value; // G
        data[i + 2] = value; // B
        data[i + 3] = 255;   // A

        // Update progress
        pixelCount++;
        if (pixelCount % chunkSize === 0) {
            onProgress(pixelCount / totalPixels);
        }
    }

    // Final progress update
    onProgress(1.0);

    return imageData;
}

/**
 * Get default parameters for random pattern
 */
export function getDefaultRandomParams() {
    return {
        distribution: 'uniform',
        seed: undefined
    };
}
