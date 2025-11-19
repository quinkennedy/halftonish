/**
 * Peano Curve Pattern Generator
 * Generates space-filling Peano curves as SDF patterns for halftoning
 */

/**
 * Generate Peano curve points recursively
 * The Peano curve uses a 3x3 subdivision pattern
 * @param {number} iteration - Current iteration level (0 to n)
 * @param {number} x - X coordinate
 * @param {number} y - Y coordinate
 * @param {number} size - Size of current cell
 * @param {number} direction - Direction: 0=right, 1=up, 2=left, 3=down
 * @param {Array} points - Array to accumulate points
 */
function peanoRecursive(iteration, x, y, size, direction, points) {
    if (iteration === 0) {
        // Base case: add the center point of this cell
        points.push({ x: x + size / 2, y: y + size / 2 });
        return;
    }

    const step = size / 3;

    // The Peano curve has different patterns based on direction
    // Direction 0 (right): standard pattern
    // Direction 1 (up): rotated 90° counterclockwise
    // Direction 2 (left): rotated 180°
    // Direction 3 (down): rotated 90° clockwise

    const patterns = [
        // Pattern 0 (rightward): meanders right
        [
            [0, 0, 0], [0, 1, 2], [0, 2, 0],
            [1, 2, 2], [1, 1, 0], [1, 0, 2],
            [2, 0, 0], [2, 1, 2], [2, 2, 0]
        ],
        // Pattern 1 (upward): meanders up
        [
            [2, 0, 1], [1, 0, 3], [0, 0, 1],
            [0, 1, 3], [1, 1, 1], [2, 1, 3],
            [2, 2, 1], [1, 2, 3], [0, 2, 1]
        ],
        // Pattern 2 (leftward): meanders left
        [
            [2, 2, 2], [2, 1, 0], [2, 0, 2],
            [1, 0, 0], [1, 1, 2], [1, 2, 0],
            [0, 2, 2], [0, 1, 0], [0, 0, 2]
        ],
        // Pattern 3 (downward): meanders down
        [
            [0, 2, 3], [1, 2, 1], [2, 2, 3],
            [2, 1, 1], [1, 1, 3], [0, 1, 1],
            [0, 0, 3], [1, 0, 1], [2, 0, 3]
        ]
    ];

    const pattern = patterns[direction];

    for (let i = 0; i < pattern.length; i++) {
        const [dx, dy, newDir] = pattern[i];
        peanoRecursive(
            iteration - 1,
            x + dx * step,
            y + dy * step,
            step,
            newDir,
            points
        );
    }
}

/**
 * Generate Peano curve points for given iteration
 * @param {number} iterations - Number of iterations (1-6)
 * @param {number} size - Size of the space
 * @returns {Array<{x: number, y: number}>} Array of curve points
 */
function generatePeanoPoints(iterations, size) {
    const points = [];
    peanoRecursive(iterations, 0, 0, size, 0, points);
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
 * Generate Peano curve pattern as SDF (Signed Distance Field)
 * @param {number} width - Width in pixels
 * @param {number} height - Height in pixels
 * @param {Object} params - Pattern parameters
 * @param {number} params.iterations - Peano curve iterations (1-6)
 * @param {number} params.lineWidth - Line width multiplier (0.1-10.0)
 * @param {Function} onProgress - Progress callback (0-1)
 * @param {Object} cancelToken - Cancellation token {cancelled: boolean}
 * @returns {ImageData} Generated pattern
 */
export function generatePeanoPattern(width, height, params, onProgress, cancelToken) {
    const {
        iterations = 4,
        lineWidth = 2.0
    } = params;

    // Use the smaller dimension to ensure curve fits
    const size = Math.min(width, height);

    // Generate Peano curve points
    const points = generatePeanoPoints(iterations, size);

    if (points.length < 2) {
        throw new Error('Not enough points generated for Peano curve');
    }

    // Calculate offset to center the curve
    const offsetX = (width - size) / 2;
    const offsetY = (height - size) / 2;

    // Create ImageData
    const imageData = new ImageData(width, height);
    const data = imageData.data;

    // Calculate maximum distance based on canvas size
    // Peano uses 3^n subdivision, so cell size is size / 3^iterations
    const maxDist = (size / Math.pow(3, iterations)) * lineWidth;

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
 * Get default parameters for Peano curve pattern
 */
export function getDefaultPeanoParams() {
    return {
        iterations: 4,
        lineWidth: 2.0
    };
}
