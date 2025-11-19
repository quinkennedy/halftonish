/**
 * Pattern Generation Web Worker
 * Generates halftone patterns without blocking the main thread
 */

import { generateRandomPattern } from '../patterns/random-pattern.js';
import { generateNoisePattern } from '../patterns/noise-pattern.js';
import { generateBendayPattern } from '../patterns/benday-pattern.js';
import { generateHilbertPattern } from '../patterns/hilbert-pattern.js';

// Cancellation state
let cancelToken = { cancelled: false };

self.addEventListener('message', async (e) => {
    const { type, pattern, params, width, height } = e.data;

    if (type === 'render') {
        // Reset cancellation
        cancelToken.cancelled = false;

        try {
            const imageData = await renderPattern(pattern, params, width, height);

            // Send completed result
            self.postMessage({
                type: 'complete',
                imageData: imageData
            }, [imageData.data.buffer]);
        } catch (error) {
            if (error.message === 'Generation cancelled') {
                self.postMessage({ type: 'cancelled' });
            } else {
                self.postMessage({
                    type: 'error',
                    message: error.message
                });
            }
        }
    } else if (type === 'cancel') {
        // Set cancellation flag
        cancelToken.cancelled = true;
    }
});

/**
 * Progress callback for pattern generators
 */
function onProgress(progress) {
    self.postMessage({
        type: 'progress',
        progress: progress
    });
}

/**
 * Render pattern based on type
 */
async function renderPattern(patternType, params, width, height) {
    let imageData;

    switch (patternType) {
        case 'random':
            imageData = generateRandomPattern(width, height, params, onProgress, cancelToken);
            break;

        case 'noise':
            imageData = generateNoisePattern(width, height, params, onProgress, cancelToken);
            break;

        case 'benday':
            imageData = generateBendayPattern(width, height, params, onProgress, cancelToken);
            break;

        case 'hilbert':
            imageData = generateHilbertPattern(width, height, params, onProgress, cancelToken);
            break;

        default:
            throw new Error(`Unknown pattern type: ${patternType}`);
    }

    return imageData;
}
