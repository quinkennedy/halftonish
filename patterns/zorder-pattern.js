/**
 * Z-Order (Morton) Curve Pattern Generator
 * Generates space-filling Z-order curves as SDF patterns for halftoning
 * Simpler and faster than Hilbert or Peano curves
 */

/**
 * Interleave bits of x and y coordinates to generate Morton code
 * @param {number} x - X coordinate
 * @param {number} y - Y coordinate
 * @returns {number} Morton code
 */
function mortonEncode(x, y) {
    let result = 0;
    for (let i = 0; i < 16; i++) {
        result |= ((x & (1 << i)) << i) | ((y & (1 << i)) << (i + 1));
    }
    return result;
}

/**
 * Generate Z-order curve points for given iteration
 * @param {number} iterations - Number of iterations (1-8)
 * @param {number} size - Size of the space
 * @returns {Array<{x: number, y: number}>} Array of curve points
 */
function generateZOrderPoints(iterations, size) {
    const gridSize = Math.pow(2, iterations);
    const cellSize = size / gridSize;
    const points = [];

    // Create array of all points with their Morton codes
    const pointsWithCodes = [];
    for (let y = 0; y < gridSize; y++) {
        for (let x = 0; x < gridSize; x++) {
            const code = mortonEncode(x, y);
            pointsWithCodes.push({
                code: code,
                x: x * cellSize + cellSize / 2,
                y: y * cellSize + cellSize / 2
            });
        }
    }

    // Sort by Morton code to get Z-order traversal
    pointsWithCodes.sort((a, b) => a.code - b.code);

    // Extract just the coordinates
    for (let i = 0; i < pointsWithCodes.length; i++) {
        points.push({
            x: pointsWithCodes[i].x,
            y: pointsWithCodes[i].y
        });
    }

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
 * Generate Z-order curve pattern as SDF (Signed Distance Field)
 * @param {number} width - Width in pixels
 * @param {number} height - Height in pixels
 * @param {Object} params - Pattern parameters
 * @param {number} params.iterations - Z-order curve iterations (1-8)
 * @param {number} params.lineWidth - Line width multiplier (0.1-10.0)
 * @param {Function} onProgress - Progress callback (0-1)
 * @param {Object} cancelToken - Cancellation token {cancelled: boolean}
 * @returns {ImageData} Generated pattern
 */
export function generateZOrderPattern(width, height, params, onProgress, cancelToken) {
    const {
        iterations = 5,
        lineWidth = 2.0
    } = params;

    // Use the smaller dimension to ensure curve fits
    const size = Math.min(width, height);

    // Generate Z-order curve points
    const points = generateZOrderPoints(iterations, size);

    if (points.length < 2) {
        throw new Error('Not enough points generated for Z-order curve');
    }

    // Calculate offset to center the curve
    const offsetX = (width - size) / 2;
    const offsetY = (height - size) / 2;

    // Create ImageData
    const imageData = new ImageData(width, height);
    const data = imageData.data;

    // Calculate maximum distance based on canvas size
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
 * Get default parameters for Z-order curve pattern
 */
export function getDefaultZOrderParams() {
    return {
        iterations: 5,
        lineWidth: 2.0
    };
}
