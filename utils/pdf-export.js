/**
 * PDF Export Utility
 * Handles PDF generation with embedded pattern images and metadata
 */

/**
 * Export canvas as PDF
 * @param {HTMLCanvasElement} canvas - Canvas containing the pattern
 * @param {Object} metadata - Pattern metadata
 * @param {string} metadata.patternType - Pattern type (e.g., "Hilbert Curve")
 * @param {number} metadata.iterations - Pattern iterations
 * @param {number} metadata.lineWidth - Pattern line width
 * @param {number} metadata.widthPx - Width in pixels
 * @param {number} metadata.heightPx - Height in pixels
 * @param {number} [metadata.dpi] - DPI (if physical mode)
 * @param {number} [metadata.physicalWidth] - Physical width
 * @param {number} [metadata.physicalHeight] - Physical height
 * @param {string} [metadata.unit] - Physical unit (in/mm)
 * @param {string} filename - Output filename
 */
export async function exportPatternToPDF(canvas, metadata, filename) {
    // Check if jsPDF is available
    if (typeof window.jspdf === 'undefined') {
        throw new Error('jsPDF library not loaded');
    }

    const { jsPDF } = window.jspdf;

    // Calculate page size in mm (jsPDF uses mm)
    let widthMM, heightMM;

    if (metadata.dpi && metadata.physicalWidth && metadata.physicalHeight) {
        // Use physical dimensions if available
        if (metadata.unit === 'mm') {
            widthMM = metadata.physicalWidth;
            heightMM = metadata.physicalHeight;
        } else {
            // Convert inches to mm (1 inch = 25.4mm)
            widthMM = metadata.physicalWidth * 25.4;
            heightMM = metadata.physicalHeight * 25.4;
        }
    } else {
        // Calculate from pixels assuming 72 DPI as default
        const dpi = metadata.dpi || 72;
        widthMM = (metadata.widthPx / dpi) * 25.4;
        heightMM = (metadata.heightPx / dpi) * 25.4;
    }

    // Create PDF with custom page size
    const orientation = widthMM > heightMM ? 'landscape' : 'portrait';
    const pdf = new jsPDF({
        orientation,
        unit: 'mm',
        format: [widthMM, heightMM]
    });

    // Convert canvas to data URL (high quality PNG)
    const imgData = canvas.toDataURL('image/png', 1.0);

    // Add image to PDF (full page)
    pdf.addImage(imgData, 'PNG', 0, 0, widthMM, heightMM, undefined, 'FAST');

    // Set PDF metadata/properties
    pdf.setProperties({
        title: `Halftonish - ${metadata.patternType}`,
        subject: 'SDF Halftone Pattern',
        author: 'Halftonish',
        keywords: `${metadata.patternType}, halftone, pattern, SDF`,
        creator: 'Halftonish Web App'
    });

    // Add metadata page
    pdf.addPage();
    pdf.setFontSize(14);
    pdf.setFont(undefined, 'bold');
    pdf.text('Pattern Metadata', 10, 10);

    pdf.setFontSize(11);
    pdf.setFont(undefined, 'normal');
    let y = 20;
    const lineHeight = 7;

    pdf.text(`Pattern Type: ${metadata.patternType}`, 10, y);
    y += lineHeight;

    if (metadata.iterations !== undefined) {
        pdf.text(`Iterations: ${metadata.iterations}`, 10, y);
        y += lineHeight;
    }

    if (metadata.lineWidth !== undefined) {
        pdf.text(`Line Width: ${metadata.lineWidth}`, 10, y);
        y += lineHeight;
    }

    pdf.text(`Dimensions: ${metadata.widthPx} × ${metadata.heightPx} pixels`, 10, y);
    y += lineHeight;

    if (metadata.dpi) {
        pdf.text(`DPI: ${metadata.dpi}`, 10, y);
        y += lineHeight;

        if (metadata.physicalWidth && metadata.physicalHeight && metadata.unit) {
            pdf.text(`Physical Size: ${metadata.physicalWidth} × ${metadata.physicalHeight} ${metadata.unit}`, 10, y);
            y += lineHeight;
        }
    }

    const timestamp = new Date().toISOString();
    pdf.text(`Generated: ${timestamp}`, 10, y);
    y += lineHeight;

    pdf.text(`Created with Halftonish`, 10, y);

    // Save PDF
    pdf.save(filename);
}

/**
 * Get metadata object from application state
 * @param {Object} state - Application state
 * @returns {Object} Metadata object for PDF export
 */
export function getMetadataFromState(state) {
    const metadata = {
        patternType: capitalizePattern(state.currentPattern),
        iterations: state.parameters.iterations,
        lineWidth: state.parameters.lineWidth,
        widthPx: state.sizeConfig.finalWidthPx,
        heightPx: state.sizeConfig.finalHeightPx
    };

    // Add physical dimensions if in physical mode
    if (state.sizeConfig.mode === 'physical') {
        metadata.dpi = state.sizeConfig.dpi;
        metadata.physicalWidth = state.sizeConfig.widthPhysical;
        metadata.physicalHeight = state.sizeConfig.heightPhysical;
        metadata.unit = state.sizeConfig.unit;
    }

    return metadata;
}

/**
 * Capitalize pattern name for display
 * @param {string} pattern - Pattern name (e.g., "hilbert")
 * @returns {string} Capitalized name (e.g., "Hilbert Curve")
 */
function capitalizePattern(pattern) {
    const patternNames = {
        'hilbert': 'Hilbert Curve',
        'peano': 'Peano Curve',
        'zorder': 'Z-Order Curve',
        'morton': 'Morton Curve',
        'gosper': 'Gosper Curve'
    };

    return patternNames[pattern] || pattern.charAt(0).toUpperCase() + pattern.slice(1);
}
