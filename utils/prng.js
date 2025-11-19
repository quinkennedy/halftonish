/**
 * Seeded Pseudo-Random Number Generator
 * Simple implementation based on Mulberry32
 */

export class SeededRandom {
    constructor(seed = Date.now()) {
        this.seed = seed >>> 0; // ensure positive 32-bit integer
    }

    /**
     * Generate next random number [0, 1)
     */
    next() {
        let t = this.seed += 0x6D2B79F5;
        t = Math.imul(t ^ t >>> 15, t | 1);
        t ^= t + Math.imul(t ^ t >>> 7, t | 61);
        return ((t ^ t >>> 14) >>> 0) / 4294967296;
    }

    /**
     * Generate random integer in range [min, max)
     */
    nextInt(min, max) {
        return Math.floor(this.next() * (max - min)) + min;
    }

    /**
     * Generate random number with normal distribution (Box-Muller transform)
     * @param {number} mean - Mean of distribution
     * @param {number} stddev - Standard deviation
     */
    nextGaussian(mean = 0, stddev = 1) {
        const u1 = this.next();
        const u2 = this.next();
        const z0 = Math.sqrt(-2.0 * Math.log(u1)) * Math.cos(2.0 * Math.PI * u2);
        return z0 * stddev + mean;
    }

    /**
     * Reset seed
     */
    reset(seed) {
        this.seed = seed >>> 0;
    }
}

/**
 * Create a seeded random number generator
 * @param {number} seed - Seed value
 * @returns {SeededRandom}
 */
export function createSeededRandom(seed) {
    return new SeededRandom(seed);
}
