/**
 * Darkness Analyzer
 * Orchestrates darkness analysis using web worker
 */

export class DarknessAnalyzer {
    constructor() {
        this.worker = null;
        this.isAnalyzing = false;
    }

    /**
     * Analyze pattern darkness
     * @param {ImageData} imageData - Image to analyze
     * @param {Object} config - Analysis configuration
     * @param {number} config.radiusInches - Radius in inches
     * @param {number} config.dpi - DPI for radius calculation
     * @param {number} config.upperThreshold - Upper threshold (0-1)
     * @param {number} config.lowerThreshold - Lower threshold (0-1)
     * @param {Function} onProgress - Progress callback (progress: 0-1)
     * @returns {Promise<Object>} Analysis result
     */
    async analyze(imageData, config, onProgress) {
        if (this.isAnalyzing) {
            throw new Error('Analysis already in progress');
        }

        this.isAnalyzing = true;

        try {
            // Calculate radius in pixels
            const radiusPixels = config.radiusInches * config.dpi;

            // Create worker
            this.worker = new Worker('workers/analysis-worker.js');

            // Set up promise for completion
            const result = await new Promise((resolve, reject) => {
                this.worker.onmessage = (e) => {
                    const { type, progress, darknessMap, stats, stride, samplesWide, samplesHigh, message } = e.data;

                    if (type === 'progress') {
                        if (onProgress) {
                            onProgress(progress);
                        }
                    } else if (type === 'complete') {
                        resolve({
                            darknessMap,
                            stats,
                            stride,
                            samplesWide,
                            samplesHigh,
                            config: {
                                radiusPixels,
                                upperThreshold: config.upperThreshold,
                                lowerThreshold: config.lowerThreshold
                            }
                        });
                    } else if (type === 'cancelled') {
                        reject(new Error('Analysis cancelled'));
                    } else if (type === 'error') {
                        reject(new Error(message || 'Analysis failed'));
                    }
                };

                this.worker.onerror = (error) => {
                    reject(new Error('Worker error: ' + error.message));
                };

                // Start analysis
                this.worker.postMessage({
                    type: 'analyze',
                    imageData: imageData,
                    config: {
                        radiusPixels,
                        upperThreshold: config.upperThreshold,
                        lowerThreshold: config.lowerThreshold
                    }
                });
            });

            return result;
        } finally {
            this.cleanup();
        }
    }

    /**
     * Cancel ongoing analysis
     */
    cancel() {
        if (this.worker) {
            this.worker.postMessage({ type: 'cancel' });
        }
    }

    /**
     * Clean up worker
     */
    cleanup() {
        if (this.worker) {
            this.worker.terminate();
            this.worker = null;
        }
        this.isAnalyzing = false;
    }
}

/**
 * Get default analysis configuration
 * @param {number} dpi - Current DPI
 * @returns {Object} Default config
 */
export function getDefaultAnalysisConfig(dpi = 300) {
    return {
        radiusInches: 0.125, // 1/8 inch default
        dpi: dpi,
        upperThreshold: 0.7,
        lowerThreshold: 0.3
    };
}
