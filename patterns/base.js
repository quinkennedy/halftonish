/**
 * Base class for all SDF patterns
 */
export class SDFPattern {
    /**
     * Get pattern name
     * @returns {string}
     */
    get name() {
        throw new Error('Must implement name getter');
    }

    /**
     * Compute signed distance field
     * @param {number} x - Normalized x coordinate [0, 1]
     * @param {number} y - Normalized y coordinate [0, 1]
     * @param {object} params - Pattern parameters
     * @returns {number} Signed distance (negative = inside)
     */
    sdf(x, y, params) {
        throw new Error('Must implement sdf method');
    }

    /**
     * Get default parameters
     * @returns {object}
     */
    getDefaults() {
        return {
            iterations: 5,
            lineWidth: 2.0
        };
    }
}
