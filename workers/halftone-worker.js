/**
 * Halftone Processing Web Worker
 * Applies halftone effects to images without blocking the main thread
 */

self.addEventListener('message', async (e) => {
    const { type, imageData, patternData, method } = e.data;

    if (type === 'apply') {
        try {
            await applyHalftone(imageData, patternData, method);
        } catch (error) {
            self.postMessage({
                type: 'error',
                message: error.message
            });
        }
    } else if (type === 'cancel') {
        // Handle cancellation
        self.postMessage({ type: 'cancelled' });
    }
});

/**
 * Apply halftone effect
 */
async function applyHalftone(imageData, patternData, method) {
    const { width, height } = imageData;
    const result = new ImageData(width, height);
    const totalPixels = width * height;
    const chunkSize = 10000;

    for (let i = 0; i < totalPixels; i++) {
        // Send progress updates
        if (i % chunkSize === 0) {
            self.postMessage({
                type: 'progress',
                progress: i / totalPixels
            });

            // Allow cancellation
            await new Promise(resolve => setTimeout(resolve, 0));
        }

        const idx = i * 4;

        // Convert to grayscale
        const gray = 0.299 * imageData.data[idx] +
                     0.587 * imageData.data[idx + 1] +
                     0.114 * imageData.data[idx + 2];

        // Get pattern value
        const patternValue = patternData.data[idx];

        // Apply method
        let output;
        switch (method) {
            case 'threshold':
                output = gray > patternValue ? 255 : 0;
                break;
            case 'blend':
                output = (gray * patternValue) / 255;
                break;
            default:
                output = gray;
        }

        result.data[idx] = result.data[idx + 1] = result.data[idx + 2] = output;
        result.data[idx + 3] = 255;
    }

    // Send completed result
    self.postMessage({
        type: 'complete',
        imageData: result
    }, [result.data.buffer]);
}
