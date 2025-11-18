/**
 * Hilbert space-filling curve pattern
 */
import { SDFPattern } from './base.js';

export class HilbertPattern extends SDFPattern {
    get name() {
        return 'hilbert';
    }

    sdf(x, y, params) {
        // TODO: Implement Hilbert curve SDF
        // This is a placeholder implementation
        const points = this.generateHilbertPoints(params.iterations || 5);
        return this.distanceToPolyline(x, y, points, params.lineWidth || 2.0);
    }

    /**
     * Generate Hilbert curve points
     * @param {number} iterations - Recursion depth
     * @returns {Array<[number, number]>} Array of [x, y] points
     */
    generateHilbertPoints(iterations) {
        const points = [];
        const n = Math.pow(2, iterations);

        for (let i = 0; i < n * n; i++) {
            const [hx, hy] = this.hilbertIndexToXY(i, iterations);
            points.push([hx / n, hy / n]);
        }

        return points;
    }

    /**
     * Convert Hilbert curve index to XY coordinates
     * @param {number} index - Linear index
     * @param {number} order - Curve order
     * @returns {[number, number]} [x, y] coordinates
     */
    hilbertIndexToXY(index, order) {
        let x = 0, y = 0;
        for (let s = 1; s < (1 << order); s *= 2) {
            const rx = 1 & (index / 2);
            const ry = 1 & (index ^ rx);
            [x, y] = this.rotate(s, x, y, rx, ry);
            x += s * rx;
            y += s * ry;
            index = Math.floor(index / 4);
        }
        return [x, y];
    }

    /**
     * Rotate/flip quadrant
     */
    rotate(n, x, y, rx, ry) {
        if (ry === 0) {
            if (rx === 1) {
                x = n - 1 - x;
                y = n - 1 - y;
            }
            return [y, x];
        }
        return [x, y];
    }

    /**
     * Calculate distance to polyline
     * @param {number} px - Point x
     * @param {number} py - Point y
     * @param {Array} points - Polyline points
     * @param {number} lineWidth - Line width
     * @returns {number} Distance
     */
    distanceToPolyline(px, py, points, lineWidth) {
        let minDist = Infinity;

        for (let i = 0; i < points.length - 1; i++) {
            const [x1, y1] = points[i];
            const [x2, y2] = points[i + 1];
            const dist = this.distanceToSegment(px, py, x1, y1, x2, y2);
            minDist = Math.min(minDist, dist);
        }

        return minDist - (lineWidth / 1000);
    }

    /**
     * Calculate distance to line segment
     */
    distanceToSegment(px, py, x1, y1, x2, y2) {
        const dx = x2 - x1;
        const dy = y2 - y1;
        const t = Math.max(0, Math.min(1,
            ((px - x1) * dx + (py - y1) * dy) / (dx * dx + dy * dy)
        ));
        const closestX = x1 + t * dx;
        const closestY = y1 + t * dy;
        return Math.hypot(px - closestX, py - closestY);
    }
}
