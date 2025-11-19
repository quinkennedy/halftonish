/**
 * Gosper (Flowsnake) Curve Pattern Generator
 * Generates hexagonal space-filling Gosper curves as SDF patterns
 */

/**
 * L-system rules for Gosper curve
 * A -> A-B--B+A++AA+B-
 * B -> +A-BB--B-A++A+B
 */
function generateGosperLSystem(iterations) {
    let current = 'A';

    for (let i = 0; i < iterations; i++) {
        let next = '';
        for (let j = 0; j < current.length; j++) {
            const char = current[j];
            if (char === 'A') {
                next += 'A-B--B+A++AA+B-';
            } else if (char === 'B') {
                next += '+A-BB--B-A++A+B';
            } else {
                next += char; // Keep + and - as is
            }
        }
        current = next;
    }

    return current;
}

/**
 * Convert L-system string to points using turtle graphics
 * @param {string} lSystem - L-system string
 * @param {number} size - Size of the curve
 * @returns {Array<{x: number, y: number}>} Array of points
 */
function lSystemToPoints(lSystem, size) {
    const points = [];

    // Turtle state
    let x = 0;
    let y = 0;
    let angle = 0; // Current direction in degrees
    const angleStep = 60; // Gosper uses 60-degree turns for hexagonal pattern

    // Calculate step size based on iterations
    // The curve grows by 7^(n/2), so we scale accordingly
    const steps = lSystem.replace(/[^AB]/g, '').length;
    const stepSize = size / Math.sqrt(steps);

    // Add starting point
    points.push({ x, y });

    // Process L-system
    for (let i = 0; i < lSystem.length; i++) {
        const char = lSystem[i];

        if (char === 'A' || char === 'B') {
            // Move forward
            const rad = (angle * Math.PI) / 180;
            x += Math.cos(rad) * stepSize;
            y += Math.sin(rad) * stepSize;
            points.push({ x, y });
        } else if (char === '+') {
            // Turn left
            angle += angleStep;
        } else if (char === '-') {
            // Turn right
            angle -= angleStep;
        }
    }

    return points;
}

/**
 * Center and normalize points to fit in size
 */
function normalizePoints(points, size) {
    if (points.length === 0) return points;

    // Find bounding box
    let minX = Infinity, minY = Infinity;
    let maxX = -Infinity, maxY = -Infinity;

    for (const p of points) {
        if (p.x < minX) minX = p.x;
        if (p.x > maxX) maxX = p.x;
        if (p.y < minY) minY = p.y;
        if (p.y > maxY) maxY = p.y;
    }

    const width = maxX - minX;
    const height = maxY - minY;
    const scale = Math.min(size / width, size / height) * 0.9; // 0.9 for padding

    // Center and scale
    const offsetX = (size - width * scale) / 2;
    const offsetY = (size - height * scale) / 2;

    return points.map(p => ({
        x: (p.x - minX) * scale + offsetX,
        y: (p.y - minY) * scale + offsetY
    }));
}

/**
 * Generate Gosper curve points for given iteration
 * @param {number} iterations - Number of iterations (1-6)
 * @param {number} size - Size of the space
 * @returns {Array<{x: number, y: number}>} Array of curve points
 */
function generateGosperPoints(iterations, size) {
    const lSystem = generateGosperLSystem(iterations);
    const rawPoints = lSystemToPoints(lSystem, size);
    return normalizePoints(rawPoints, size);
}

/**
 * Calculate distance from point to line segment
 */
function distanceToSegment(px, py, x1, y1, x2, y2) {
    const dx = x2 - x1;
    const dy = y2 - y1;
    const lengthSquared = dx * dx + dy * dy;

    if (lengthSquared === 0) {
        const dpx = px - x1;
        const dpy = py - y1;
        return Math.sqrt(dpx * dpx + dpy * dpy);
    }

    let t = ((px - x1) * dx + (py - y1) * dy) / lengthSquared;
    t = Math.max(0, Math.min(1, t));

    const closestX = x1 + t * dx;
    const closestY = y1 + t * dy;

    const distX = px - closestX;
    const distY = py - closestY;
    return Math.sqrt(distX * distX + distY * distY);
}

/**
 * Generate Gosper curve pattern as SDF (Signed Distance Field)
 * @param {number} width - Width in pixels
 * @param {number} height - Height in pixels
 * @param {Object} params - Pattern parameters
 * @param {number} params.iterations - Gosper curve iterations (1-6)
 * @param {number} params.lineWidth - Line width multiplier (0.1-10.0)
 * @param {Function} onProgress - Progress callback (0-1)
 * @param {Object} cancelToken - Cancellation token {cancelled: boolean}
 * @returns {ImageData} Generated pattern
 */
export function generateGosperPattern(width, height, params, onProgress, cancelToken) {
    const {
        iterations = 4,
        lineWidth = 2.0
    } = params;

    // Use the smaller dimension to ensure curve fits
    const size = Math.min(width, height);

    // Generate Gosper curve points
    const points = generateGosperPoints(iterations, size);

    if (points.length < 2) {
        throw new Error('Not enough points generated for Gosper curve');
    }

    // Calculate offset to center the curve
    const offsetX = (width - size) / 2;
    const offsetY = (height - size) / 2;

    // Create ImageData
    const imageData = new ImageData(width, height);
    const data = imageData.data;

    // Calculate maximum distance - Gosper uses hexagonal tiling
    const maxDist = (size / Math.pow(Math.sqrt(7), iterations)) * lineWidth;

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
            data[idx] = gray;
            data[idx + 1] = gray;
            data[idx + 2] = gray;
            data[idx + 3] = 255;
        }

        // Update progress
        onProgress((y + 1) / height);
    }

    return imageData;
}

/**
 * Get default parameters for Gosper curve pattern
 */
export function getDefaultGosperParams() {
    return {
        iterations: 4,
        lineWidth: 2.0
    };
}
