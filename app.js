/**
 * Halftonish - Main Application Controller
 * Manages UI state, user interactions, and worker communication
 */

import { SizeCalculator } from './utils/size-calculator.js';
import { exportPatternToPDF, getMetadataFromState } from './utils/pdf-export.js';
import { DarknessAnalyzer, getDefaultAnalysisConfig } from './analysis/darkness-analyzer.js';
import { generateOverlay, compositeOverlay, formatStats } from './analysis/overlay-renderer.js';

// Application state
const state = {
    currentPattern: 'hilbert',
    parameters: {
        iterations: 5,
        lineWidth: 2.0,
        invert: false
    },
    sizeConfig: {
        mode: 'pixel',
        widthPx: 1000,
        heightPx: 1000,
        widthPhysical: 8.5,
        heightPhysical: 11,
        unit: 'in',
        dpi: 300,
        finalWidthPx: 1000,
        finalHeightPx: 1000
    },
    rendering: {
        isGenerating: false,
        isApplying: false,
        isAnalyzing: false,
        progress: 0
    },
    uploadedImage: null,
    generatedPattern: null,
    exportFormat: 'png',
    analysisConfig: getDefaultAnalysisConfig(300),
    analysisResult: null,
    showOverlay: true,
    importedPattern: null,
    workers: {
        pattern: null,
        halftone: null
    },
    analyzer: new DarknessAnalyzer()
};

// DOM elements
const elements = {
    // Pattern controls
    patternSelect: document.getElementById('pattern-select'),
    iterationsSlider: document.getElementById('iterations'),
    iterationsValue: document.getElementById('iterations-value'),
    lineWidthSlider: document.getElementById('line-width'),
    lineWidthValue: document.getElementById('line-width-value'),
    invertCheckbox: document.getElementById('invert'),

    // Size mode controls
    sizeModeRadios: document.getElementsByName('size-mode'),
    pixelSizeControls: document.getElementById('pixel-size-controls'),
    physicalSizeControls: document.getElementById('physical-size-controls'),
    widthPx: document.getElementById('width-px'),
    heightPx: document.getElementById('height-px'),
    widthPhysical: document.getElementById('width-physical'),
    heightPhysical: document.getElementById('height-physical'),
    unitSelect: document.getElementById('unit-select'),
    heightUnit: document.getElementById('height-unit'),
    dpi: document.getElementById('dpi'),
    outputDimensions: document.getElementById('output-dimensions'),

    // Export controls
    exportFormat: document.getElementById('export-format'),

    // Pattern generation
    generateBtn: document.getElementById('generate-btn'),
    cancelGenerateBtn: document.getElementById('cancel-generate-btn'),
    generateProgress: document.getElementById('generate-progress'),
    generateProgressFill: document.getElementById('generate-progress-fill'),
    generateProgressText: document.getElementById('generate-progress-text'),
    patternCanvas: document.getElementById('pattern-canvas'),
    downloadPatternBtn: document.getElementById('download-pattern-btn'),

    // Darkness analysis
    importPattern: document.getElementById('import-pattern'),
    analysisRadiusSlider: document.getElementById('analysis-radius'),
    analysisRadiusValue: document.getElementById('analysis-radius-value'),
    upperThresholdSlider: document.getElementById('upper-threshold'),
    upperThresholdValue: document.getElementById('upper-threshold-value'),
    lowerThresholdSlider: document.getElementById('lower-threshold'),
    lowerThresholdValue: document.getElementById('lower-threshold-value'),
    showOverlayCheckbox: document.getElementById('show-overlay'),
    analyzeBtn: document.getElementById('analyze-btn'),
    cancelAnalysisBtn: document.getElementById('cancel-analysis-btn'),
    analysisProgress: document.getElementById('analysis-progress'),
    analysisProgressFill: document.getElementById('analysis-progress-fill'),
    analysisProgressText: document.getElementById('analysis-progress-text'),
    analysisCanvas: document.getElementById('analysis-canvas'),
    analysisStats: document.getElementById('analysis-stats'),
    statsContent: document.getElementById('stats-content'),

    // Image halftone
    imageUpload: document.getElementById('image-upload'),
    halftoneMethod: document.getElementById('halftone-method'),
    applyHalftoneBtn: document.getElementById('apply-halftone-btn'),
    cancelHalftoneBtn: document.getElementById('cancel-halftone-btn'),
    halftoneProgress: document.getElementById('halftone-progress'),
    halftoneProgressFill: document.getElementById('halftone-progress-fill'),
    halftoneProgressText: document.getElementById('halftone-progress-text'),
    resultCanvas: document.getElementById('result-canvas'),
    downloadResultBtn: document.getElementById('download-result-btn')
};

/**
 * Initialize application
 */
function init() {
    console.log('Halftonish v0.1.0-dev initializing...');

    // Setup event listeners
    setupControlListeners();
    setupActionListeners();

    console.log('Application ready');
}

/**
 * Setup control input listeners
 */
function setupControlListeners() {
    // Pattern selection
    elements.patternSelect.addEventListener('change', (e) => {
        state.currentPattern = e.target.value;
    });

    // Iterations slider
    elements.iterationsSlider.addEventListener('input', (e) => {
        const value = parseInt(e.target.value);
        state.parameters.iterations = value;
        elements.iterationsValue.textContent = value;
    });

    // Line width slider
    elements.lineWidthSlider.addEventListener('input', (e) => {
        const value = parseFloat(e.target.value);
        state.parameters.lineWidth = value;
        elements.lineWidthValue.textContent = value.toFixed(1);
    });

    // Invert checkbox
    elements.invertCheckbox.addEventListener('change', (e) => {
        state.parameters.invert = e.target.checked;
    });

    // Size mode radio buttons
    elements.sizeModeRadios.forEach(radio => {
        radio.addEventListener('change', (e) => {
            state.sizeConfig.mode = e.target.value;
            updateSizeModeUI();
            updateOutputDimensions();
        });
    });

    // Pixel size inputs
    elements.widthPx.addEventListener('input', (e) => {
        state.sizeConfig.widthPx = parseInt(e.target.value) || 256;
        updateOutputDimensions();
    });

    elements.heightPx.addEventListener('input', (e) => {
        state.sizeConfig.heightPx = parseInt(e.target.value) || 256;
        updateOutputDimensions();
    });

    // Physical size inputs
    elements.widthPhysical.addEventListener('input', (e) => {
        state.sizeConfig.widthPhysical = parseFloat(e.target.value) || 1;
        updateOutputDimensions();
    });

    elements.heightPhysical.addEventListener('input', (e) => {
        state.sizeConfig.heightPhysical = parseFloat(e.target.value) || 1;
        updateOutputDimensions();
    });

    elements.unitSelect.addEventListener('change', (e) => {
        state.sizeConfig.unit = e.target.value;
        elements.heightUnit.textContent = e.target.value;
        updateOutputDimensions();
    });

    elements.dpi.addEventListener('input', (e) => {
        state.sizeConfig.dpi = parseInt(e.target.value) || 72;
        updateOutputDimensions();
    });

    // Export format
    elements.exportFormat.addEventListener('change', (e) => {
        state.exportFormat = e.target.value;
    });
}

/**
 * Update size mode UI visibility
 */
function updateSizeModeUI() {
    if (state.sizeConfig.mode === 'pixel') {
        elements.pixelSizeControls.style.display = 'flex';
        elements.physicalSizeControls.style.display = 'none';
    } else {
        elements.pixelSizeControls.style.display = 'none';
        elements.physicalSizeControls.style.display = 'flex';
    }
}

/**
 * Update output dimensions display
 */
function updateOutputDimensions() {
    const result = SizeCalculator.calculatePixelDimensions(state.sizeConfig);

    if (result.valid) {
        state.sizeConfig.finalWidthPx = result.width;
        state.sizeConfig.finalHeightPx = result.height;
        elements.outputDimensions.textContent = SizeCalculator.formatDimensions(result.width, result.height);
        elements.outputDimensions.style.color = 'var(--primary-color)';
    } else {
        elements.outputDimensions.textContent = result.error || 'Invalid dimensions';
        elements.outputDimensions.style.color = 'var(--error)';
    }
}

/**
 * Setup action button listeners
 */
function setupActionListeners() {
    // Generate pattern
    elements.generateBtn.addEventListener('click', generatePattern);
    elements.cancelGenerateBtn.addEventListener('click', cancelGenerate);

    // Download pattern
    elements.downloadPatternBtn.addEventListener('click', downloadPattern);

    // Image upload
    elements.imageUpload.addEventListener('change', handleImageUpload);

    // Apply halftone
    elements.applyHalftoneBtn.addEventListener('click', applyHalftone);
    elements.cancelHalftoneBtn.addEventListener('click', cancelHalftone);

    // Download result
    elements.downloadResultBtn.addEventListener('click', downloadResult);
}

/**
 * Generate pattern
 */
async function generatePattern() {
    console.log('Generating pattern:', state.currentPattern, state.parameters, state.sizeConfig);

    // Validate size
    const sizeResult = SizeCalculator.calculatePixelDimensions(state.sizeConfig);
    if (!sizeResult.valid) {
        alert('Invalid size: ' + sizeResult.error);
        return;
    }

    const width = sizeResult.width;
    const height = sizeResult.height;

    // Update UI
    state.rendering.isGenerating = true;
    elements.generateBtn.disabled = true;
    elements.cancelGenerateBtn.style.display = 'inline-block';
    elements.generateProgress.style.display = 'block';
    elements.downloadPatternBtn.disabled = true;

    try {
        // TODO: Implement worker-based pattern generation
        // For now, show placeholder
        updateGenerateProgress(0);

        // Simulate progress
        for (let i = 0; i <= 100; i += 10) {
            await new Promise(resolve => setTimeout(resolve, 100));
            updateGenerateProgress(i / 100);
        }

        // Create placeholder canvas
        const canvas = elements.patternCanvas;
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');

        // Draw placeholder
        ctx.fillStyle = '#f0f0f0';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = '#333';
        ctx.font = '24px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('Pattern generation', canvas.width / 2, canvas.height / 2 - 20);
        ctx.fillText('coming soon!', canvas.width / 2, canvas.height / 2 + 20);
        ctx.fillText(`${width} × ${height} px`, canvas.width / 2, canvas.height / 2 + 40);

        // Store generated pattern
        state.generatedPattern = ctx.getImageData(0, 0, width, height);

        // Enable download
        elements.downloadPatternBtn.disabled = false;

        console.log('Pattern generated successfully:', width, 'x', height);
    } catch (error) {
        console.error('Pattern generation failed:', error);
        alert('Failed to generate pattern: ' + error.message);
    } finally {
        // Reset UI
        state.rendering.isGenerating = false;
        elements.generateBtn.disabled = false;
        elements.cancelGenerateBtn.style.display = 'none';
        elements.generateProgress.style.display = 'none';
    }
}

/**
 * Cancel pattern generation
 */
function cancelGenerate() {
    console.log('Cancelling pattern generation');

    if (state.workers.pattern) {
        state.workers.pattern.terminate();
        state.workers.pattern = null;
    }

    state.rendering.isGenerating = false;
    elements.generateBtn.disabled = false;
    elements.cancelGenerateBtn.style.display = 'none';
    elements.generateProgress.style.display = 'none';
}

/**
 * Update generate progress
 */
function updateGenerateProgress(progress) {
    const percent = Math.round(progress * 100);
    elements.generateProgressFill.style.width = percent + '%';
    elements.generateProgressText.textContent = percent + '%';
}

/**
 * Download pattern
 */
async function downloadPattern() {
    const canvas = elements.patternCanvas;
    const timestamp = Date.now();
    const format = state.exportFormat;

    try {
        if (format === 'pdf') {
            // Export as PDF
            const metadata = getMetadataFromState(state);
            const filename = `halftonish-${state.currentPattern}-${timestamp}.pdf`;
            await exportPatternToPDF(canvas, metadata, filename);
            console.log('Pattern exported as PDF:', filename);
        } else {
            // Export as PNG
            canvas.toBlob((blob) => {
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `halftonish-${state.currentPattern}-${timestamp}.png`;
                a.click();
                URL.revokeObjectURL(url);
                console.log('Pattern exported as PNG');
            }, 'image/png', 1.0);
        }
    } catch (error) {
        console.error('Failed to download pattern:', error);
        alert('Failed to download pattern: ' + error.message);
    }
}

/**
 * Handle image upload
 */
async function handleImageUpload(e) {
    const file = e.target.files[0];
    if (!file) return;

    console.log('Loading image:', file.name);

    try {
        const img = new Image();
        img.onload = () => {
            // Draw to canvas
            const canvas = elements.resultCanvas;
            canvas.width = img.width;
            canvas.height = img.height;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0);

            // Store image data
            state.uploadedImage = ctx.getImageData(0, 0, canvas.width, canvas.height);

            // Enable halftone button
            elements.applyHalftoneBtn.disabled = false;

            console.log('Image loaded:', img.width, 'x', img.height);
        };
        img.onerror = () => {
            throw new Error('Failed to load image');
        };
        img.src = URL.createObjectURL(file);
    } catch (error) {
        console.error('Image upload failed:', error);
        alert('Failed to load image: ' + error.message);
    }
}

/**
 * Apply halftone
 */
async function applyHalftone() {
    console.log('Applying halftone');

    if (!state.uploadedImage) {
        alert('Please upload an image first');
        return;
    }

    // Update UI
    state.rendering.isApplying = true;
    elements.applyHalftoneBtn.disabled = true;
    elements.cancelHalftoneBtn.style.display = 'inline-block';
    elements.halftoneProgress.style.display = 'block';
    elements.downloadResultBtn.disabled = true;

    try {
        // TODO: Implement worker-based halftone processing
        // For now, show placeholder
        updateHalftoneProgress(0);

        // Simulate progress
        for (let i = 0; i <= 100; i += 10) {
            await new Promise(resolve => setTimeout(resolve, 100));
            updateHalftoneProgress(i / 100);
        }

        // Enable download
        elements.downloadResultBtn.disabled = false;

        console.log('Halftone applied successfully');
    } catch (error) {
        console.error('Halftone application failed:', error);
        alert('Failed to apply halftone: ' + error.message);
    } finally {
        // Reset UI
        state.rendering.isApplying = false;
        elements.applyHalftoneBtn.disabled = false;
        elements.cancelHalftoneBtn.style.display = 'none';
        elements.halftoneProgress.style.display = 'none';
    }
}

/**
 * Cancel halftone application
 */
function cancelHalftone() {
    console.log('Cancelling halftone application');

    if (state.workers.halftone) {
        state.workers.halftone.terminate();
        state.workers.halftone = null;
    }

    state.rendering.isApplying = false;
    elements.applyHalftoneBtn.disabled = false;
    elements.cancelHalftoneBtn.style.display = 'none';
    elements.halftoneProgress.style.display = 'none';
}

/**
 * Update halftone progress
 */
function updateHalftoneProgress(progress) {
    const percent = Math.round(progress * 100);
    elements.halftoneProgressFill.style.width = percent + '%';
    elements.halftoneProgressText.textContent = percent + '%';
}

/**
 * Download result
 */
function downloadResult() {
    const canvas = elements.resultCanvas;
    canvas.toBlob((blob) => {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `halftonish-result-${Date.now()}.png`;
        a.click();
        URL.revokeObjectURL(url);
    });
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}
