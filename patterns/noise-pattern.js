/**
 * Noise Pattern Generator
 * Generates smooth Perlin/Simplex noise patterns
 */

import { SeededRandom } from '../utils/prng.js';

/**
 * Simple 2D Simplex Noise implementation
 * Based on Stefan Gustavson's implementation
 */
class SimplexNoise {
    constructor(seed = Math.random) {
        const rng = typeof seed === 'function' ? seed : new SeededRandom(seed).next.bind(new SeededRandom(seed));

        // Generate permutation table
        this.perm = new Uint8Array(512);
        this.permMod12 = new Uint8Array(512);

        const p = new Uint8Array(256);
        for (let i = 0; i < 256; i++) {
            p[i] = i;
        }

        // Shuffle
        for (let i = 255; i > 0; i--) {
            const j = Math.floor(rng() * (i + 1));
            [p[i], p[j]] = [p[j], p[i]];
        }

        for (let i = 0; i < 512; i++) {
            this.perm[i] = p[i & 255];
            this.permMod12[i] = this.perm[i] % 12;
        }

        // Gradients for 2D simplex
        this.grad3 = new Float32Array([
            1, 1, 0,  -1, 1, 0,  1, -1, 0,  -1, -1, 0,
            1, 0, 1,  -1, 0, 1,  1, 0, -1,  -1, 0, -1,
            0, 1, 1,  0, -1, 1,  0, 1, -1,  0, -1, -1
        ]);
    }

    dot(g, x, y) {
        return g[0] * x + g[1] * y;
    }

    noise2D(xin, yin) {
        const F2 = 0.5 * (Math.sqrt(3.0) - 1.0);
        const G2 = (3.0 - Math.sqrt(3.0)) / 6.0;

        let n0, n1, n2;

        const s = (xin + yin) * F2;
        const i = Math.floor(xin + s);
        const j = Math.floor(yin + s);
        const t = (i + j) * G2;
        const X0 = i - t;
        const Y0 = j - t;
        const x0 = xin - X0;
        const y0 = yin - Y0;

        let i1, j1;
        if (x0 > y0) {
            i1 = 1;
            j1 = 0;
        } else {
            i1 = 0;
            j1 = 1;
        }

        const x1 = x0 - i1 + G2;
        const y1 = y0 - j1 + G2;
        const x2 = x0 - 1.0 + 2.0 * G2;
        const y2 = y0 - 1.0 + 2.0 * G2;

        const ii = i & 255;
        const jj = j & 255;
        const gi0 = this.permMod12[ii + this.perm[jj]] * 3;
        const gi1 = this.permMod12[ii + i1 + this.perm[jj + j1]] * 3;
        const gi2 = this.permMod12[ii + 1 + this.perm[jj + 1]] * 3;

        let t0 = 0.5 - x0 * x0 - y0 * y0;
        if (t0 < 0) {
            n0 = 0.0;
        } else {
            t0 *= t0;
            n0 = t0 * t0 * this.dot(this.grad3.slice(gi0, gi0 + 3), x0, y0);
        }

        let t1 = 0.5 - x1 * x1 - y1 * y1;
        if (t1 < 0) {
            n1 = 0.0;
        } else {
            t1 *= t1;
            n1 = t1 * t1 * this.dot(this.grad3.slice(gi1, gi1 + 3), x1, y1);
        }

        let t2 = 0.5 - x2 * x2 - y2 * y2;
        if (t2 < 0) {
            n2 = 0.0;
        } else {
            t2 *= t2;
            n2 = t2 * t2 * this.dot(this.grad3.slice(gi2, gi2 + 3), x2, y2);
        }

        return 70.0 * (n0 + n1 + n2);
    }
}

/**
 * Generate noise pattern with multiple octaves
 * @param {number} width - Width in pixels
 * @param {number} height - Height in pixels
 * @param {Object} params - Pattern parameters
 * @param {number} params.scale - Frequency scale (0.1-10.0)
 * @param {number} params.octaves - Number of octaves (1-8)
 * @param {number} params.persistence - Amplitude falloff (0.0-1.0)
 * @param {number} [params.seed] - Optional seed for reproducibility
 * @param {Function} onProgress - Progress callback (0-1)
 * @param {Object} cancelToken - Cancellation token {cancelled: boolean}
 * @returns {ImageData} Generated pattern
 */
export function generateNoisePattern(width, height, params, onProgress, cancelToken) {
    const {
        scale = 1.0,
        octaves = 4,
        persistence = 0.5,
        seed
    } = params;

    // Create noise generator
    const noise = new SimplexNoise(seed !== undefined ? seed : Math.random);

    // Create ImageData
    const imageData = new ImageData(width, height);
    const data = imageData.data;

    // Normalize scale for better visual results
    const baseFrequency = scale * 0.01;

    // Process row by row for progress updates
    for (let y = 0; y < height; y++) {
        // Check for cancellation
        if (cancelToken && cancelToken.cancelled) {
            throw new Error('Generation cancelled');
        }

        for (let x = 0; x < width; x++) {
            let value = 0;
            let amplitude = 1;
            let frequency = baseFrequency;
            let maxValue = 0;

            // Combine multiple octaves
            for (let octave = 0; octave < octaves; octave++) {
                const sampleX = x * frequency;
                const sampleY = y * frequency;

                const noiseValue = noise.noise2D(sampleX, sampleY);
                value += noiseValue * amplitude;
                maxValue += amplitude;

                amplitude *= persistence;
                frequency *= 2.0;
            }

            // Normalize to 0-1 range, then to 0-255
            const normalized = (value / maxValue + 1.0) / 2.0;
            const gray = Math.floor(Math.max(0, Math.min(1, normalized)) * 255);

            const idx = (y * width + x) * 4;
            data[idx] = gray;     // R
            data[idx + 1] = gray; // G
            data[idx + 2] = gray; // B
            data[idx + 3] = 255;  // A
        }

        // Update progress
        onProgress((y + 1) / height);
    }

    return imageData;
}

/**
 * Get default parameters for noise pattern
 */
export function getDefaultNoiseParams() {
    return {
        scale: 1.0,
        octaves: 4,
        persistence: 0.5,
        seed: undefined
    };
}
