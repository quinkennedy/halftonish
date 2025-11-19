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
    currentPattern: 'random',
    parameters: {
        // Hilbert parameters (legacy)
        iterations: 5,
        lineWidth: 2.0,
        invert: false,
        // Random parameters
        randomDistribution: 'uniform',
        randomSeed: undefined,
        // Noise parameters
        noiseScale: 1.0,
        noiseOctaves: 4,
        noisePersistence: 0.5,
        noiseSeed: undefined,
        // Ben-Day parameters
        bendaySpacing: 20,
        bendaySize: 0.7,
        bendayShape: 'circle',
        bendayGrid: 'square',
        bendayAntialiasing: true
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

    // Pattern parameter groups
    randomParams: document.getElementById('random-params'),
    noiseParams: document.getElementById('noise-params'),
    bendayParams: document.getElementById('benday-params'),
    hilbertParams: document.getElementById('hilbert-params'),

    // Random pattern controls
    randomDistribution: document.getElementById('random-distribution'),
    randomSeed: document.getElementById('random-seed'),

    // Noise pattern controls
    noiseScale: document.getElementById('noise-scale'),
    noiseScaleValue: document.getElementById('noise-scale-value'),
    noiseOctaves: document.getElementById('noise-octaves'),
    noiseOctavesValue: document.getElementById('noise-octaves-value'),
    noisePersistence: document.getElementById('noise-persistence'),
    noisePersistenceValue: document.getElementById('noise-persistence-value'),
    noiseSeed: document.getElementById('noise-seed'),

    // Ben-Day pattern controls
    bendaySpacing: document.getElementById('benday-spacing'),
    bendaySpacingValue: document.getElementById('benday-spacing-value'),
    bendaySize: document.getElementById('benday-size'),
    bendaySizeValue: document.getElementById('benday-size-value'),
    bendayShape: document.getElementById('benday-shape'),
    bendayGrid: document.getElementById('benday-grid'),
    bendayAntialiasing: document.getElementById('benday-antialiasing'),

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

    // Initialize UI state
    updatePatternParameters();
    updateSizeModeUI();
    updateOutputDimensions();

    console.log('Application ready');
}

/**
 * Setup control input listeners
 */
function setupControlListeners() {
    // Pattern selection
    elements.patternSelect.addEventListener('change', (e) => {
        state.currentPattern = e.target.value;
        updatePatternParameters();
    });

    // Random pattern parameters
    elements.randomDistribution.addEventListener('change', (e) => {
        state.parameters.randomDistribution = e.target.value;
    });
    elements.randomSeed.addEventListener('input', (e) => {
        const value = e.target.value;
        state.parameters.randomSeed = value ? parseInt(value) : undefined;
    });

    // Noise pattern parameters
    elements.noiseScale.addEventListener('input', (e) => {
        const value = parseFloat(e.target.value);
        state.parameters.noiseScale = value;
        elements.noiseScaleValue.textContent = value.toFixed(1);
    });
    elements.noiseOctaves.addEventListener('input', (e) => {
        const value = parseInt(e.target.value);
        state.parameters.noiseOctaves = value;
        elements.noiseOctavesValue.textContent = value;
    });
    elements.noisePersistence.addEventListener('input', (e) => {
        const value = parseFloat(e.target.value);
        state.parameters.noisePersistence = value;
        elements.noisePersistenceValue.textContent = value.toFixed(2);
    });
    elements.noiseSeed.addEventListener('input', (e) => {
        const value = e.target.value;
        state.parameters.noiseSeed = value ? parseInt(value) : undefined;
    });

    // Ben-Day pattern parameters
    elements.bendaySpacing.addEventListener('input', (e) => {
        const value = parseInt(e.target.value);
        state.parameters.bendaySpacing = value;
        elements.bendaySpacingValue.textContent = value;
    });
    elements.bendaySize.addEventListener('input', (e) => {
        const value = parseFloat(e.target.value);
        state.parameters.bendaySize = value;
        elements.bendaySizeValue.textContent = value.toFixed(2);
    });
    elements.bendayShape.addEventListener('change', (e) => {
        state.parameters.bendayShape = e.target.value;
    });
    elements.bendayGrid.addEventListener('change', (e) => {
        state.parameters.bendayGrid = e.target.value;
    });
    elements.bendayAntialiasing.addEventListener('change', (e) => {
        state.parameters.bendayAntialiasing = e.target.checked;
    });

    // Hilbert parameters (legacy, if needed)
    if (elements.iterationsSlider) {
        elements.iterationsSlider.addEventListener('input', (e) => {
            const value = parseInt(e.target.value);
            state.parameters.iterations = value;
            elements.iterationsValue.textContent = value;
        });
    }
    if (elements.lineWidthSlider) {
        elements.lineWidthSlider.addEventListener('input', (e) => {
            const value = parseFloat(e.target.value);
            state.parameters.lineWidth = value;
            elements.lineWidthValue.textContent = value.toFixed(1);
        });
    }

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

    // Analysis radius slider
    elements.analysisRadiusSlider.addEventListener('input', (e) => {
        const value = parseFloat(e.target.value);
        state.analysisConfig.radiusInches = value;
        elements.analysisRadiusValue.textContent = value.toFixed(4);
    });

    // Upper threshold slider
    elements.upperThresholdSlider.addEventListener('input', (e) => {
        const value = parseFloat(e.target.value);
        state.analysisConfig.upperThreshold = value;
        elements.upperThresholdValue.textContent = (value * 100).toFixed(0);
    });

    // Lower threshold slider
    elements.lowerThresholdSlider.addEventListener('input', (e) => {
        const value = parseFloat(e.target.value);
        state.analysisConfig.lowerThreshold = value;
        elements.lowerThresholdValue.textContent = (value * 100).toFixed(0);
    });

    // Show overlay checkbox
    elements.showOverlayCheckbox.addEventListener('change', (e) => {
        state.showOverlay = e.target.checked;
        // Re-render analysis if we have results
        if (state.analysisResult) {
            renderAnalysisResult();
        }
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
 * Update pattern parameter UI based on selected pattern
 */
function updatePatternParameters() {
    // Hide all parameter groups
    elements.randomParams.style.display = 'none';
    elements.noiseParams.style.display = 'none';
    elements.bendayParams.style.display = 'none';
    elements.hilbertParams.style.display = 'none';

    // Show relevant parameter group
    switch (state.currentPattern) {
        case 'random':
            elements.randomParams.style.display = 'block';
            break;
        case 'noise':
            elements.noiseParams.style.display = 'block';
            break;
        case 'benday':
            elements.bendayParams.style.display = 'block';
            break;
        case 'hilbert':
            elements.hilbertParams.style.display = 'block';
            break;
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

    // Pattern import for analysis
    elements.importPattern.addEventListener('change', handlePatternImport);

    // Darkness analysis
    elements.analyzeBtn.addEventListener('click', analyzeDarkness);
    elements.cancelAnalysisBtn.addEventListener('click', cancelAnalysis);
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
        // Prepare pattern-specific parameters
        let params = {};

        switch (state.currentPattern) {
            case 'random':
                params = {
                    distribution: state.parameters.randomDistribution,
                    seed: state.parameters.randomSeed
                };
                break;
            case 'noise':
                params = {
                    scale: state.parameters.noiseScale,
                    octaves: state.parameters.noiseOctaves,
                    persistence: state.parameters.noisePersistence,
                    seed: state.parameters.noiseSeed
                };
                break;
            case 'benday':
                params = {
                    spacing: state.parameters.bendaySpacing,
                    dotSize: state.parameters.bendaySize,
                    shape: state.parameters.bendayShape,
                    gridType: state.parameters.bendayGrid,
                    antialiasing: state.parameters.bendayAntialiasing
                };
                break;
            case 'hilbert':
                params = {
                    iterations: state.parameters.iterations,
                    lineWidth: state.parameters.lineWidth
                };
                break;
        }

        console.log('Pattern params:', params);

        // Create worker if needed
        if (!state.workers.pattern) {
            state.workers.pattern = new Worker('./workers/pattern-worker.js', { type: 'module' });
        }

        const worker = state.workers.pattern;

        // Set up promise for worker completion
        const result = await new Promise((resolve, reject) => {
            // Message handler
            const handleMessage = (e) => {
                const { type, progress, imageData, message } = e.data;

                if (type === 'progress') {
                    updateGenerateProgress(progress);
                } else if (type === 'complete') {
                    worker.removeEventListener('message', handleMessage);
                    resolve(imageData);
                } else if (type === 'error') {
                    worker.removeEventListener('message', handleMessage);
                    reject(new Error(message));
                } else if (type === 'cancelled') {
                    worker.removeEventListener('message', handleMessage);
                    reject(new Error('Generation cancelled'));
                }
            };

            worker.addEventListener('message', handleMessage);

            // Send render request
            worker.postMessage({
                type: 'render',
                pattern: state.currentPattern,
                params: params,
                width: width,
                height: height
            });
        });

        // Draw result to canvas
        const canvas = elements.patternCanvas;
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.putImageData(result, 0, 0);

        // Store generated pattern
        state.generatedPattern = result;

        // Copy to analysis canvas and enable analysis
        const analysisCanvas = elements.analysisCanvas;
        analysisCanvas.width = width;
        analysisCanvas.height = height;
        const analysisCtx = analysisCanvas.getContext('2d');
        analysisCtx.putImageData(state.generatedPattern, 0, 0);

        // Enable download and analysis
        elements.downloadPatternBtn.disabled = false;
        elements.analyzeBtn.disabled = false;

        console.log('Pattern generated successfully:', width, 'x', height);
    } catch (error) {
        console.error('Pattern generation failed:', error);
        if (error.message !== 'Generation cancelled') {
            alert('Failed to generate pattern: ' + error.message);
        }
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
        // Send cancel message
        state.workers.pattern.postMessage({ type: 'cancel' });
    }
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

/**
 * Handle pattern import for analysis
 */
async function handlePatternImport(e) {
    const file = e.target.files[0];
    if (!file) return;

    console.log('Importing pattern for analysis:', file.name);

    try {
        // Check if PDF or image
        if (file.type === 'application/pdf') {
            await loadPDFPattern(file);
        } else if (file.type.startsWith('image/')) {
            await loadImagePattern(file);
        } else {
            throw new Error('Unsupported file type. Please use PNG, JPG, or PDF.');
        }
    } catch (error) {
        console.error('Pattern import failed:', error);
        alert('Failed to import pattern: ' + error.message);
    }
}

/**
 * Load image pattern (PNG, JPG, etc.)
 */
async function loadImagePattern(file) {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => {
            // Draw to analysis canvas
            const canvas = elements.analysisCanvas;
            canvas.width = img.width;
            canvas.height = img.height;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0);

            // Store image data
            state.importedPattern = ctx.getImageData(0, 0, canvas.width, canvas.height);

            // Update DPI in analysis config if physical mode
            if (state.sizeConfig.mode === 'physical') {
                state.analysisConfig.dpi = state.sizeConfig.dpi;
            }

            // Enable analyze button
            elements.analyzeBtn.disabled = false;

            console.log('Image pattern imported:', img.width, 'x', img.height);
            resolve();
        };
        img.onerror = () => {
            reject(new Error('Failed to load pattern image'));
        };
        img.src = URL.createObjectURL(file);
    });
}

/**
 * Load PDF pattern (extract first page)
 */
async function loadPDFPattern(file) {
    // Check if PDF.js is available
    if (typeof pdfjsLib === 'undefined') {
        throw new Error('PDF.js library not loaded');
    }

    // Set worker source
    pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';

    // Read file as array buffer
    const arrayBuffer = await file.arrayBuffer();

    // Load PDF document
    const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
    const pdf = await loadingTask.promise;

    console.log('PDF loaded:', pdf.numPages, 'pages');

    // Get first page
    const page = await pdf.getPage(1);

    // Get viewport at scale 1
    const viewport = page.getViewport({ scale: 1.0 });

    // Prepare canvas
    const canvas = elements.analysisCanvas;
    canvas.width = viewport.width;
    canvas.height = viewport.height;
    const ctx = canvas.getContext('2d');

    // Render page to canvas
    await page.render({
        canvasContext: ctx,
        viewport: viewport
    }).promise;

    // Store image data
    state.importedPattern = ctx.getImageData(0, 0, canvas.width, canvas.height);

    // Update DPI in analysis config if physical mode
    if (state.sizeConfig.mode === 'physical') {
        state.analysisConfig.dpi = state.sizeConfig.dpi;
    }

    // Enable analyze button
    elements.analyzeBtn.disabled = false;

    console.log('PDF pattern imported:', canvas.width, 'x', canvas.height);
}

/**
 * Analyze pattern darkness
 */
async function analyzeDarkness() {
    console.log('Analyzing pattern darkness');

    // Get pattern to analyze (imported or generated)
    let imageData = state.importedPattern || state.generatedPattern;

    if (!imageData) {
        alert('Please generate or import a pattern first');
        return;
    }

    // Update UI
    state.rendering.isAnalyzing = true;
    elements.analyzeBtn.disabled = true;
    elements.cancelAnalysisBtn.style.display = 'inline-block';
    elements.analysisProgress.style.display = 'block';
    elements.analysisStats.style.display = 'none';

    try {
        // Update DPI from current size config
        state.analysisConfig.dpi = state.sizeConfig.dpi || 300;

        // Run analysis with progress callback
        const result = await state.analyzer.analyze(
            imageData,
            state.analysisConfig,
            (progress) => {
                updateAnalysisProgress(progress);
            }
        );

        // Store result
        state.analysisResult = result;

        // Render result
        renderAnalysisResult();

        console.log('Analysis complete:', result.stats);
    } catch (error) {
        console.error('Analysis failed:', error);
        if (error.message !== 'Analysis cancelled') {
            alert('Analysis failed: ' + error.message);
        }
    } finally {
        // Reset UI
        state.rendering.isAnalyzing = false;
        elements.analyzeBtn.disabled = false;
        elements.cancelAnalysisBtn.style.display = 'none';
        elements.analysisProgress.style.display = 'none';
    }
}

/**
 * Cancel darkness analysis
 */
function cancelAnalysis() {
    console.log('Cancelling analysis');
    state.analyzer.cancel();
}

/**
 * Update analysis progress
 */
function updateAnalysisProgress(progress) {
    const percent = Math.round(progress * 100);
    elements.analysisProgressFill.style.width = percent + '%';
    elements.analysisProgressText.textContent = percent + '%';
}

/**
 * Render analysis result with overlay and stats
 */
function renderAnalysisResult() {
    if (!state.analysisResult) return;

    const canvas = elements.analysisCanvas;
    const ctx = canvas.getContext('2d');

    // Get base image
    const baseImage = state.importedPattern || state.generatedPattern;
    if (!baseImage) return;

    // Ensure canvas size matches
    if (canvas.width !== baseImage.width || canvas.height !== baseImage.height) {
        canvas.width = baseImage.width;
        canvas.height = baseImage.height;
    }

    // Draw base image
    ctx.putImageData(baseImage, 0, 0);

    // Generate and composite overlay if enabled
    if (state.showOverlay) {
        const overlayCanvas = generateOverlay(
            state.analysisResult.darknessMap,
            state.analysisResult.samplesWide,
            state.analysisResult.samplesHigh,
            state.analysisResult.stride,
            baseImage.width,
            baseImage.height,
            state.analysisResult.config.upperThreshold,
            state.analysisResult.config.lowerThreshold
        );

        compositeOverlay(canvas, overlayCanvas);
    }

    // Update stats display
    const statsHTML = formatStats(state.analysisResult.stats);
    elements.statsContent.innerHTML = statsHTML;
    elements.analysisStats.style.display = 'block';
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}
