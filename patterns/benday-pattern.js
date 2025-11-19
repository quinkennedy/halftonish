/**
 * Ben-Day Dots Pattern Generator
 * Generates regular dot grids for classic halftone printing effects
 */

/**
 * Smoothstep function for anti-aliasing
 */
function smoothstep(edge0, edge1, x) {
    const t = Math.max(0, Math.min(1, (x - edge0) / (edge1 - edge0)));
    return t * t * (3 - 2 * t);
}

/**
 * Calculate distance from point to nearest dot center in square grid
 */
function squareGridDistance(x, y, spacing) {
    const gridX = Math.round(x / spacing) * spacing;
    const gridY = Math.round(y / spacing) * spacing;
    const dx = x - gridX;
    const dy = y - gridY;
    return Math.sqrt(dx * dx + dy * dy);
}

/**
 * Calculate distance from point to nearest dot center in hexagonal grid
 */
function hexGridDistance(x, y, spacing) {
    // For hexagonal close-packed grid with nearest-neighbor distance = spacing:
    // - Horizontal spacing within row: spacing
    // - Vertical spacing between rows: spacing * sqrt(3) / 2
    // - Horizontal offset for odd rows: spacing / 2
    const hexHeight = spacing * Math.sqrt(3) / 2;  // vertical row spacing
    const hexWidth = spacing;  // horizontal spacing within row
    const rowOffset = spacing / 2;  // offset for alternating rows

    // Convert to hex grid coordinates
    const row = Math.round(y / hexHeight);
    const col = Math.round((x - (row % 2) * rowOffset) / hexWidth);

    // Check this cell and neighbors
    let minDist = Infinity;

    for (let dr = -1; dr <= 1; dr++) {
        for (let dc = -1; dc <= 1; dc++) {
            const r = row + dr;
            const c = col + dc;

            const centerX = c * hexWidth + (r % 2) * rowOffset;
            const centerY = r * hexHeight;

            const dx = x - centerX;
            const dy = y - centerY;
            const dist = Math.sqrt(dx * dx + dy * dy);

            if (dist < minDist) {
                minDist = dist;
            }
        }
    }

    return minDist;
}

/**
 * Calculate dot shape value
 */
function getDotValue(distance, radius, shape, antialiasing) {
    let sdf;

    if (shape === 'circle') {
        sdf = distance - radius;
    } else if (shape === 'square') {
        // For square, we need different distance calculation
        // This is a simplified version
        sdf = distance * Math.SQRT2 - radius;
    } else if (shape === 'diamond') {
        // Diamond shape (45-degree rotated square)
        sdf = distance * 1.4 - radius;
    } else {
        sdf = distance - radius;
    }

    if (antialiasing) {
        // Smooth transition around edge
        return 1.0 - smoothstep(-1, 1, sdf);
    } else {
        // Sharp edge
        return sdf < 0 ? 1.0 : 0.0;
    }
}

/**
 * Generate Ben-Day dots pattern as SDF (Signed Distance Field)
 * Linear gradient from dot centers to grid cell corners
 * @param {number} width - Width in pixels
 * @param {number} height - Height in pixels
 * @param {Object} params - Pattern parameters
 * @param {number} params.spacing - Dot spacing in pixels
 * @param {number} params.dotSize - Not used for linear SDF (kept for compatibility)
 * @param {string} params.shape - 'circle', 'square', or 'diamond' (future use)
 * @param {string} params.gridType - 'square' or 'hexagonal'
 * @param {boolean} params.antialiasing - Not used for SDF (kept for compatibility)
 * @param {Function} onProgress - Progress callback (0-1)
 * @param {Object} cancelToken - Cancellation token {cancelled: boolean}
 * @returns {ImageData} Generated pattern
 */
export function generateBendayPattern(width, height, params, onProgress, cancelToken) {
    const {
        spacing = 20,
        dotSize = 0.7,
        shape = 'circle',
        gridType = 'square',
        antialiasing = true
    } = params;

    // Create ImageData
    const imageData = new ImageData(width, height);
    const data = imageData.data;

    // Maximum distance from dot center to furthest point in grid cell
    // For square grid: diagonal from center to corner = spacing / sqrt(2)
    // For hexagonal grid: distance from center to hexagon corner = spacing
    let maxDist;
    if (gridType === 'hexagonal') {
        // For hex grid, furthest point is at hexagon corner
        maxDist = spacing;
    } else {
        // For square grid, furthest point is at diagonal corner
        maxDist = spacing / Math.sqrt(2);
    }

    // Process row by row for progress updates
    for (let y = 0; y < height; y++) {
        // Check for cancellation
        if (cancelToken && cancelToken.cancelled) {
            throw new Error('Generation cancelled');
        }

        for (let x = 0; x < width; x++) {
            // Find distance to nearest dot center
            let distance;
            if (gridType === 'hexagonal') {
                distance = hexGridDistance(x, y, spacing);
            } else {
                distance = squareGridDistance(x, y, spacing);
            }

            // Linear gradient: normalize distance to 0-1 range
            // Distance 0 (at dot center) -> 0
            // Distance maxDist (at grid cell corner) -> 1
            let normalizedDist = distance / maxDist;

            // Clamp to 0-1
            normalizedDist = Math.max(0, Math.min(1, normalizedDist));

            // Convert to grayscale: 0 = black (at dot center), 255 = white (at corners)
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
 * Get default parameters for Ben-Day dots pattern
 */
export function getDefaultBendayParams() {
    return {
        spacing: 20,
        dotSize: 0.7,
        shape: 'circle',
        gridType: 'square',
        antialiasing: true
    };
}

/**
 * Convert physical spacing to pixels
 * @param {number} spacingInches - Spacing in inches
 * @param {number} dpi - Dots per inch
 * @returns {number} Spacing in pixels
 */
export function spacingInchesToPixels(spacingInches, dpi) {
    return spacingInches * dpi;
}

/**
 * Convert pixel spacing to physical
 * @param {number} spacingPixels - Spacing in pixels
 * @param {number} dpi - Dots per inch
 * @returns {number} Spacing in inches
 */
export function spacingPixelsToInches(spacingPixels, dpi) {
    return spacingPixels / dpi;
}
