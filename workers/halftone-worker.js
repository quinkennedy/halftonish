/**
 * Halftone Processing Web Worker
 * Applies halftone effects to images without blocking the main thread
 */

// Cancellation state
let cancelToken = { cancelled: false };

self.addEventListener('message', async (e) => {
    const { type, imageData, patternData, method, contrast, brightness } = e.data;

    if (type === 'apply') {
        // Reset cancellation
        cancelToken.cancelled = false;

        try {
            let result = await applyHalftone(imageData, patternData, method);

            // Apply contrast and brightness adjustments if needed
            if (contrast !== 0 || brightness !== 0) {
                result = applyContrastBrightness(result, contrast, brightness);
            }

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
 * Apply contrast and brightness adjustments
 * @param {ImageData} imageData - Image to adjust
 * @param {number} contrast - Contrast adjustment (-100 to 100)
 * @param {number} brightness - Brightness adjustment (-100 to 100)
 * @returns {ImageData} Adjusted image
 */
function applyContrastBrightness(imageData, contrast, brightness) {
    const data = imageData.data;

    // Convert -100 to 100 range to multiplier
    const contrastFactor = (259 * (contrast + 255)) / (255 * (259 - contrast));
    const brightnessFactor = brightness * 2.55; // Convert to 0-255 range

    for (let i = 0; i < data.length; i += 4) {
        // Apply contrast (centered at 128)
        let r = data[i];
        r = contrastFactor * (r - 128) + 128;

        // Apply brightness
        r += brightnessFactor;

        // Clamp to 0-255
        r = Math.max(0, Math.min(255, r));

        // Set RGB (grayscale)
        data[i] = r;
        data[i + 1] = r;
        data[i + 2] = r;
    }

    return imageData;
}

/**
 * Apply halftone effect with pattern tiling
 * @param {ImageData} imageData - Source image
 * @param {ImageData} patternData - Halftone pattern (will be tiled if smaller)
 * @param {string} method - Halftoning method ('threshold', 'blend', 'floyd-steinberg', 'ordered')
 * @returns {ImageData} Halftoned result
 */
async function applyHalftone(imageData, patternData, method) {
    if (method === 'floyd-steinberg') {
        return applyFloydSteinberg(imageData, patternData);
    } else if (method === 'ordered') {
        return applyOrderedDithering(imageData, patternData);
    } else {
        return applyThresholdOrBlend(imageData, patternData, method);
    }
}

/**
 * Apply threshold or blend halftoning with pattern tiling
 */
async function applyThresholdOrBlend(imageData, patternData, method) {
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
            const patX = x % patWidth;
            const patY = y % patHeight;
            const patternIndex = (patY * patWidth + patX) * 4;
            const patternValue = patternData.data[patternIndex];

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
            result.data[pixelIndex] = output;
            result.data[pixelIndex + 1] = output;
            result.data[pixelIndex + 2] = output;
            result.data[pixelIndex + 3] = 255;
        }

        // Send progress updates
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

/**
 * Floyd-Steinberg error diffusion dithering
 * Uses fixed threshold (128) - ignores pattern
 */
async function applyFloydSteinberg(imageData, patternData) {
    const imgWidth = imageData.width;
    const imgHeight = imageData.height;

    // Create a working copy of grayscale values (with error accumulation)
    const grayValues = new Float32Array(imgWidth * imgHeight);

    // Convert to grayscale
    for (let y = 0; y < imgHeight; y++) {
        for (let x = 0; x < imgWidth; x++) {
            const idx = (y * imgWidth + x) * 4;
            grayValues[y * imgWidth + x] =
                0.299 * imageData.data[idx] +
                0.587 * imageData.data[idx + 1] +
                0.114 * imageData.data[idx + 2];
        }
    }

    const result = new ImageData(imgWidth, imgHeight);
    const totalPixels = imgWidth * imgHeight;
    const chunkSize = 10000;
    const threshold = 128; // Fixed threshold for traditional dithering

    // Floyd-Steinberg error diffusion
    for (let y = 0; y < imgHeight; y++) {
        // Check for cancellation
        if (cancelToken.cancelled) {
            throw new Error('Halftone cancelled');
        }

        for (let x = 0; x < imgWidth; x++) {
            const idx = y * imgWidth + x;
            const oldPixel = grayValues[idx];

            // Quantize to black or white based on fixed threshold
            const newPixel = oldPixel < threshold ? 0 : 255;

            // Calculate error
            const error = oldPixel - newPixel;

            // Distribute error to neighboring pixels (Floyd-Steinberg matrix)
            if (x + 1 < imgWidth) {
                grayValues[idx + 1] += error * 7 / 16;
            }
            if (y + 1 < imgHeight) {
                if (x > 0) {
                    grayValues[idx + imgWidth - 1] += error * 3 / 16;
                }
                grayValues[idx + imgWidth] += error * 5 / 16;
                if (x + 1 < imgWidth) {
                    grayValues[idx + imgWidth + 1] += error * 1 / 16;
                }
            }

            // Write result
            const pixelIndex = idx * 4;
            result.data[pixelIndex] = newPixel;
            result.data[pixelIndex + 1] = newPixel;
            result.data[pixelIndex + 2] = newPixel;
            result.data[pixelIndex + 3] = 255;
        }

        // Send progress updates
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

/**
 * Ordered dithering using Bayer matrix
 * Uses traditional Bayer threshold - ignores pattern
 */
async function applyOrderedDithering(imageData, patternData) {
    const imgWidth = imageData.width;
    const imgHeight = imageData.height;

    // 8x8 Bayer matrix (normalized to 0-63)
    const bayerMatrix = [
        [0,  48, 12, 60, 3,  51, 15, 63],
        [32, 16, 44, 28, 35, 19, 47, 31],
        [8,  56, 4,  52, 11, 59, 7,  55],
        [40, 24, 36, 20, 43, 27, 39, 23],
        [2,  50, 14, 62, 1,  49, 13, 61],
        [34, 18, 46, 30, 33, 17, 45, 29],
        [10, 58, 6,  54, 9,  57, 5,  53],
        [42, 26, 38, 22, 41, 25, 37, 21]
    ];

    const result = new ImageData(imgWidth, imgHeight);
    const totalPixels = imgWidth * imgHeight;
    const chunkSize = 10000;

    for (let y = 0; y < imgHeight; y++) {
        // Check for cancellation
        if (cancelToken.cancelled) {
            throw new Error('Halftone cancelled');
        }

        for (let x = 0; x < imgWidth; x++) {
            const pixelIndex = (y * imgWidth + x) * 4;

            // Convert to grayscale
            const gray = 0.299 * imageData.data[pixelIndex] +
                        0.587 * imageData.data[pixelIndex + 1] +
                        0.114 * imageData.data[pixelIndex + 2];

            // Get Bayer threshold (0-255 range)
            const bayerThreshold = (bayerMatrix[y % 8][x % 8] / 64) * 255;

            // Apply threshold
            const output = gray < bayerThreshold ? 0 : 255;

            // Write result
            result.data[pixelIndex] = output;
            result.data[pixelIndex + 1] = output;
            result.data[pixelIndex + 2] = output;
            result.data[pixelIndex + 3] = 255;
        }

        // Send progress updates
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

