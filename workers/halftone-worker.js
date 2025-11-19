/**
 * Halftone Processing Web Worker
 * Applies halftone effects to images without blocking the main thread
 */

// Cancellation state
let cancelToken = { cancelled: false };

self.addEventListener('message', async (e) => {
    const { type, imageData, patternData, method } = e.data;

    if (type === 'apply') {
        // Reset cancellation
        cancelToken.cancelled = false;

        try {
            const result = await applyHalftone(imageData, patternData, method);

            // Send completed result
            self.postMessage({
                type: 'complete',
                imageData: result
            }, [result.data.buffer]);
        } catch (error) {
            if (error.message === 'Halftone cancelled') {
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
 * Apply halftone effect with pattern tiling
 * @param {ImageData} imageData - Source image
 * @param {ImageData} patternData - Halftone pattern (will be tiled if smaller)
 * @param {string} method - Halftoning method ('threshold' or 'blend')
 * @returns {ImageData} Halftoned result
 */
async function applyHalftone(imageData, patternData, method) {
    const imgWidth = imageData.width;
    const imgHeight = imageData.height;
    const patWidth = patternData.width;
    const patHeight = patternData.height;

    const result = new ImageData(imgWidth, imgHeight);
    const totalPixels = imgWidth * imgHeight;
    const chunkSize = 10000; // Progress update interval

    for (let y = 0; y < imgHeight; y++) {
        // Check for cancellation
        if (cancelToken.cancelled) {
            throw new Error('Halftone cancelled');
        }

        for (let x = 0; x < imgWidth; x++) {
            const pixelIndex = (y * imgWidth + x) * 4;

            // Convert source image to grayscale
            const gray = 0.299 * imageData.data[pixelIndex] +
                        0.587 * imageData.data[pixelIndex + 1] +
                        0.114 * imageData.data[pixelIndex + 2];

            // Get pattern value with tiling
            // Tile pattern by using modulo on coordinates
            const patX = x % patWidth;
            const patY = y % patHeight;
            const patternIndex = (patY * patWidth + patX) * 4;
            const patternValue = patternData.data[patternIndex]; // R channel (grayscale)

            // Apply halftoning method
            let output;
            if (method === 'threshold') {
                // Threshold: source < pattern => black, else white
                output = gray < patternValue ? 0 : 255;
            } else if (method === 'blend') {
                // Multiplicative blend
                output = Math.floor((gray * patternValue) / 255);
            } else {
                output = gray;
            }

            // Write result
            result.data[pixelIndex] = output;     // R
            result.data[pixelIndex + 1] = output; // G
            result.data[pixelIndex + 2] = output; // B
            result.data[pixelIndex + 3] = 255;    // A
        }

        // Send progress updates every N pixels
        const processedPixels = (y + 1) * imgWidth;
        if (processedPixels % chunkSize === 0) {
            self.postMessage({
                type: 'progress',
                progress: processedPixels / totalPixels
            });
        }
    }

    return result;
}

