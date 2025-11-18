/**
 * Halftonish - Main Application Controller
 * Manages UI state, user interactions, and worker communication
 */

// Application state
const state = {
    currentPattern: 'hilbert',
    parameters: {
        iterations: 5,
        lineWidth: 2.0,
        size: 1000,
        invert: false
    },
    rendering: {
        isGenerating: false,
        isApplying: false,
        progress: 0
    },
    uploadedImage: null,
    generatedPattern: null,
    workers: {
        pattern: null,
        halftone: null
    }
};

// DOM elements
const elements = {
    // Pattern controls
    patternSelect: document.getElementById('pattern-select'),
    iterationsSlider: document.getElementById('iterations'),
    iterationsValue: document.getElementById('iterations-value'),
    lineWidthSlider: document.getElementById('line-width'),
    lineWidthValue: document.getElementById('line-width-value'),
    sizeSlider: document.getElementById('size'),
    sizeValue: document.getElementById('size-value'),
    invertCheckbox: document.getElementById('invert'),

    // Pattern generation
    generateBtn: document.getElementById('generate-btn'),
    cancelGenerateBtn: document.getElementById('cancel-generate-btn'),
    generateProgress: document.getElementById('generate-progress'),
    generateProgressFill: document.getElementById('generate-progress-fill'),
    generateProgressText: document.getElementById('generate-progress-text'),
    patternCanvas: document.getElementById('pattern-canvas'),
    downloadPatternBtn: document.getElementById('download-pattern-btn'),

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

    // Size slider
    elements.sizeSlider.addEventListener('input', (e) => {
        const value = parseInt(e.target.value);
        state.parameters.size = value;
        elements.sizeValue.textContent = value;
    });

    // Invert checkbox
    elements.invertCheckbox.addEventListener('change', (e) => {
        state.parameters.invert = e.target.checked;
    });
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
    console.log('Generating pattern:', state.currentPattern, state.parameters);

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
        canvas.width = state.parameters.size;
        canvas.height = state.parameters.size;
        const ctx = canvas.getContext('2d');

        // Draw placeholder
        ctx.fillStyle = '#f0f0f0';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = '#333';
        ctx.font = '24px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('Pattern generation', canvas.width / 2, canvas.height / 2 - 20);
        ctx.fillText('coming soon!', canvas.width / 2, canvas.height / 2 + 20);

        // Enable download
        elements.downloadPatternBtn.disabled = false;

        console.log('Pattern generated successfully');
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
function downloadPattern() {
    const canvas = elements.patternCanvas;
    canvas.toBlob((blob) => {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `halftonish-${state.currentPattern}-${Date.now()}.png`;
        a.click();
        URL.revokeObjectURL(url);
    });
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
