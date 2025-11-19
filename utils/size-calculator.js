/**
 * Size Calculator Utility
 * Handles conversions between pixel mode and physical+DPI mode
 */

/**
 * Size configuration object
 * @typedef {Object} SizeConfig
 * @property {'pixel'|'physical'} mode - Size specification mode
 * @property {number} widthPx - Width in pixels (pixel mode)
 * @property {number} heightPx - Height in pixels (pixel mode)
 * @property {number} widthPhysical - Width in physical units (physical mode)
 * @property {number} heightPhysical - Height in physical units (physical mode)
 * @property {'in'|'mm'} unit - Physical unit
 * @property {number} dpi - Dots per inch (physical mode)
 * @property {number} finalWidthPx - Calculated final width in pixels
 * @property {number} finalHeightPx - Calculated final height in pixels
 */

export class SizeCalculator {
    /**
     * Millimeters per inch constant
     */
    static MM_PER_INCH = 25.4;

    /**
     * Minimum and maximum dimensions in pixels
     */
    static MIN_PIXELS = 256;
    static MAX_PIXELS = 4096;

    /**
     * Calculate pixel dimensions from size configuration
     * @param {SizeConfig} config - Size configuration
     * @returns {{width: number, height: number, valid: boolean, error?: string}}
     */
    static calculatePixelDimensions(config) {
        let width, height;

        if (config.mode === 'pixel') {
            width = Math.round(config.widthPx);
            height = Math.round(config.heightPx);
        } else {
            // Physical mode - convert to pixels
            const dpi = config.dpi;
            let widthInches = config.widthPhysical;
            let heightInches = config.heightPhysical;

            if (config.unit === 'mm') {
                widthInches = config.widthPhysical / this.MM_PER_INCH;
                heightInches = config.heightPhysical / this.MM_PER_INCH;
            }

            width = Math.round(widthInches * dpi);
            height = Math.round(heightInches * dpi);
        }

        // Validate dimensions
        const validation = this.validateDimensions(width, height);
        if (!validation.valid) {
            return {
                width: 0,
                height: 0,
                valid: false,
                error: validation.error
            };
        }

        return {
            width,
            height,
            valid: true
        };
    }

    /**
     * Validate pixel dimensions
     * @param {number} width - Width in pixels
     * @param {number} height - Height in pixels
     * @returns {{valid: boolean, error?: string}}
     */
    static validateDimensions(width, height) {
        if (width < this.MIN_PIXELS || height < this.MIN_PIXELS) {
            return {
                valid: false,
                error: `Dimensions must be at least ${this.MIN_PIXELS}px`
            };
        }

        if (width > this.MAX_PIXELS || height > this.MAX_PIXELS) {
            return {
                valid: false,
                error: `Dimensions must not exceed ${this.MAX_PIXELS}px`
            };
        }

        if (!Number.isFinite(width) || !Number.isFinite(height)) {
            return {
                valid: false,
                error: 'Invalid dimensions'
            };
        }

        return { valid: true };
    }

    /**
     * Convert millimeters to inches
     * @param {number} mm - Millimeters
     * @returns {number} Inches
     */
    static mmToInches(mm) {
        return mm / this.MM_PER_INCH;
    }

    /**
     * Convert inches to millimeters
     * @param {number} inches - Inches
     * @returns {number} Millimeters
     */
    static inchesToMm(inches) {
        return inches * this.MM_PER_INCH;
    }

    /**
     * Get physical dimensions from pixels and DPI
     * @param {number} pixels - Dimension in pixels
     * @param {number} dpi - Dots per inch
     * @param {'in'|'mm'} unit - Desired unit
     * @returns {number} Physical dimension
     */
    static pixelsToPhysical(pixels, dpi, unit = 'in') {
        const inches = pixels / dpi;
        return unit === 'mm' ? this.inchesToMm(inches) : inches;
    }

    /**
     * Format dimensions as readable string
     * @param {number} width - Width in pixels
     * @param {number} height - Height in pixels
     * @returns {string} Formatted string (e.g., "1000 × 1000 px")
     */
    static formatDimensions(width, height) {
        return `${width} × ${height} px`;
    }

    /**
     * Get preset size configurations
     * @returns {Array<{name: string, config: Partial<SizeConfig>}>}
     */
    static getPresets() {
        return [
            {
                name: 'Letter (8.5" × 11" @ 300dpi)',
                config: {
                    mode: 'physical',
                    widthPhysical: 8.5,
                    heightPhysical: 11,
                    unit: 'in',
                    dpi: 300
                }
            },
            {
                name: 'A4 (210mm × 297mm @ 300dpi)',
                config: {
                    mode: 'physical',
                    widthPhysical: 210,
                    heightPhysical: 297,
                    unit: 'mm',
                    dpi: 300
                }
            },
            {
                name: '4×6 Photo (4" × 6" @ 300dpi)',
                config: {
                    mode: 'physical',
                    widthPhysical: 4,
                    heightPhysical: 6,
                    unit: 'in',
                    dpi: 300
                }
            },
            {
                name: '1000×1000 px',
                config: {
                    mode: 'pixel',
                    widthPx: 1000,
                    heightPx: 1000
                }
            },
            {
                name: '2048×2048 px',
                config: {
                    mode: 'pixel',
                    widthPx: 2048,
                    heightPx: 2048
                }
            }
        ];
    }
}
