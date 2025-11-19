/**
 * Hilbert Curve Pattern Generator
 * Generates space-filling Hilbert curves as SDF patterns for halftoning
 */

/**
 * Generate Hilbert curve points recursively
 * @param {number} iteration - Current iteration level (0 to n)
 * @param {number} x - X coordinate offset
 * @param {number} y - Y coordinate offset
 * @param {number} xi - X axis direction/scale for first half
 * @param {number} xj - X axis direction/scale for second half
 * @param {number} yi - Y axis direction/scale for first half
 * @param {number} yj - Y axis direction/scale for second half
 * @param {Array} points - Array to accumulate points
 */
function hilbertRecursive(iteration, x, y, xi, xj, yi, yj, points) {
    if (iteration <= 0) {
        // Base case: add the point
        const px = x + (xi + yi) / 2;
        const py = y + (xj + yj) / 2;
        points.push({ x: px, y: py });
    } else {
        // Recursive case: subdivide into 4 quadrants
        hilbertRecursive(iteration - 1, x, y, yi / 2, yj / 2, xi / 2, xj / 2, points);
        hilbertRecursive(iteration - 1, x + xi / 2, y + xj / 2, xi / 2, xj / 2, yi / 2, yj / 2, points);
        hilbertRecursive(iteration - 1, x + xi / 2 + yi / 2, y + xj / 2 + yj / 2, xi / 2, xj / 2, yi / 2, yj / 2, points);
        hilbertRecursive(iteration - 1, x + xi / 2 + yi, y + xj / 2 + yj, -yi / 2, -yj / 2, -xi / 2, -xj / 2, points);
    }
}

/**
 * Generate Hilbert curve points for given iteration
 * @param {number} iterations - Number of iterations (1-8)
 * @param {number} size - Size of the space (typically canvas width or height)
 * @returns {Array<{x: number, y: number}>} Array of curve points
 */
function generateHilbertPoints(iterations, size) {
    const points = [];
    // Start the recursive generation
    // The initial call sets up the full space
    hilbertRecursive(iterations, 0, 0, size, 0, 0, size, points);
    return points;
}

/**
 * Calculate distance from point to line segment
 * @param {number} px - Point x
 * @param {number} py - Point y
 * @param {number} x1 - Segment start x
 * @param {number} y1 - Segment start y
 * @param {number} x2 - Segment end x
 * @param {number} y2 - Segment end y
 * @returns {number} Distance to segment
 */
function distanceToSegment(px, py, x1, y1, x2, y2) {
    const dx = x2 - x1;
    const dy = y2 - y1;
    const lengthSquared = dx * dx + dy * dy;

    if (lengthSquared === 0) {
        // Segment is a point
        const dpx = px - x1;
        const dpy = py - y1;
        return Math.sqrt(dpx * dpx + dpy * dpy);
    }

    // Calculate projection parameter t
    let t = ((px - x1) * dx + (py - y1) * dy) / lengthSquared;

    // Clamp t to [0, 1] to stay on segment
    t = Math.max(0, Math.min(1, t));

    // Find closest point on segment
    const closestX = x1 + t * dx;
    const closestY = y1 + t * dy;

    // Calculate distance
    const distX = px - closestX;
    const distY = py - closestY;
    return Math.sqrt(distX * distX + distY * distY);
}

/**
 * Generate Hilbert curve pattern as SDF (Signed Distance Field)
 * @param {number} width - Width in pixels
 * @param {number} height - Height in pixels
 * @param {Object} params - Pattern parameters
 * @param {number} params.iterations - Hilbert curve iterations (1-8)
 * @param {number} params.lineWidth - Line width multiplier (0.1-10.0)
 * @param {Function} onProgress - Progress callback (0-1)
 * @param {Object} cancelToken - Cancellation token {cancelled: boolean}
 * @returns {ImageData} Generated pattern
 */
export function generateHilbertPattern(width, height, params, onProgress, cancelToken) {
    const {
        iterations = 5,
        lineWidth = 2.0
    } = params;

    // Use the smaller dimension to ensure curve fits
    const size = Math.min(width, height);

    // Generate Hilbert curve points
    const points = generateHilbertPoints(iterations, size);

    if (points.length < 2) {
        throw new Error('Not enough points generated for Hilbert curve');
    }

    // Calculate offset to center the curve
    const offsetX = (width - size) / 2;
    const offsetY = (height - size) / 2;

    // Create ImageData
    const imageData = new ImageData(width, height);
    const data = imageData.data;

    // Calculate maximum distance based on canvas size
    // This determines how far the gradient extends from the line
    const maxDist = (size / Math.pow(2, iterations)) * lineWidth;

    // Process each pixel
    for (let y = 0; y < height; y++) {
        // Check for cancellation
        if (cancelToken && cancelToken.cancelled) {
            throw new Error('Generation cancelled');
        }

        for (let x = 0; x < width; x++) {
            // Adjust coordinates for centering
            const px = x - offsetX;
            const py = y - offsetY;

            // Find minimum distance to any segment of the curve
            let minDist = Infinity;

            for (let i = 0; i < points.length - 1; i++) {
                const p1 = points[i];
                const p2 = points[i + 1];

                const dist = distanceToSegment(px, py, p1.x, p1.y, p2.x, p2.y);

                if (dist < minDist) {
                    minDist = dist;
                }
            }

            // Normalize distance to 0-1 range
            let normalizedDist = minDist / maxDist;
            normalizedDist = Math.max(0, Math.min(1, normalizedDist));

            // Convert to grayscale: 0 (black) at curve, 255 (white) away from curve
            const gray = Math.floor(normalizedDist * 255);

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
 * Get default parameters for Hilbert curve pattern
 */
export function getDefaultHilbertParams() {
    return {
        iterations: 5,
        lineWidth: 2.0
    };
}
