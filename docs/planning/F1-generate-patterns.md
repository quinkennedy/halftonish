# F1: Generate SDF Pattern Images - Detailed Planning

**Status:** ACTIVE
**Priority:** P0
**Started:** 2025-01-XX

---

## 1. Feature Overview

This feature enables users to generate high-quality SDF (Signed Distance Field) pattern images with flexible sizing options, multiple export formats, and quality analysis tools. Users can specify dimensions in pixels or physical units with DPI, export to PNG or PDF, and analyze pattern darkness distribution to ensure optimal halftone quality.

---

## 2. Detailed Requirements

### 2.1 Size Specification

**Requirement:** Support two modes for specifying output size

**Mode 1: Pixel-Based**
- Direct input: Width and Height in pixels
- Range: 256px to 4096px per dimension
- Default: 1000x1000px
- Non-square dimensions supported

**Mode 2: Physical + DPI**
- Input: Width and Height in physical units (inches or millimeters)
- Input: DPI (dots per inch) - range 72 to 600 DPI
- Calculate: Pixel dimensions = Physical Size × DPI
- Example: 8.5" × 11" @ 300 DPI = 2550 × 3300 pixels
- Units toggle: Inches ↔ Millimeters (1 inch = 25.4mm)

**UI Controls:**
- Radio buttons or toggle: "Pixels" vs "Physical + DPI"
- When in Pixel mode: Show width/height pixel inputs
- When in Physical mode: Show width/height physical inputs + DPI input + unit selector
- Display calculated pixel dimensions in both modes
- Validation: Prevent dimensions outside supported range

### 2.2 Export Formats

**PNG Export (existing baseline)**
- Grayscale 8-bit (0-255 values)
- Canvas.toBlob() API
- Filename format: `halftonish-[pattern]-[timestamp].png`

**PDF Export (new)**
- Library: jsPDF (https://github.com/parallax/jsPDF)
- Embed pattern as high-resolution image
- Page size matches pattern dimensions (or closest standard page size)
- Include metadata in PDF:
  - Pattern type (e.g., "Hilbert Curve")
  - Parameters (iterations, line width, etc.)
  - Size (pixels and physical dimensions if applicable)
  - DPI
  - Generation timestamp
- Filename format: `halftonish-[pattern]-[timestamp].pdf`

**Export UI:**
- Dropdown selector: PNG | PDF
- Download button triggers export in selected format

### 2.3 Darkness Analysis Tool

**Purpose:** Visualize and analyze local darkness distribution in patterns to identify areas that are too dark or too light, which can cause halftone printing issues.

**Analysis Algorithm:**
1. **Sliding Window Analysis**
   - For each pixel (or grid of pixels for performance), analyze surrounding region
   - Region shape: Circle with configurable radius
   - Default radius: 1/8 inch (converted to pixels based on DPI)
   - For 300 DPI: 1/8" = 37.5 pixels radius

2. **Darkness Calculation**
   - Within radius: Count dark pixels (value < 128) vs light pixels (value ≥ 128)
   - Calculate darkness ratio: `dark_pixels / total_pixels_in_radius`
   - Darkness ratio range: 0.0 (all light) to 1.0 (all dark)

3. **Threshold Classification**
   - Too Dark: darkness ratio > upper threshold (e.g., 0.7)
   - Too Light: darkness ratio < lower threshold (e.g., 0.3)
   - Balanced: between thresholds
   - Thresholds are user-adjustable

4. **Visualization Overlay**
   - Create color overlay on pattern
   - Red overlay: Too dark areas (intensity based on how far over threshold)
   - Green overlay: Too light areas (intensity based on how far under threshold)
   - Gray/transparent: Balanced areas
   - Overlay opacity: 50-70% so pattern is still visible
   - Toggle overlay on/off

**UI Controls:**
- "Analyze Darkness" button
- Radius slider: 0.0625" to 0.5" (1/16" to 1/2") with 1/8" default
- Upper threshold slider: 0.5 to 0.9 (default 0.7)
- Lower threshold slider: 0.1 to 0.5 (default 0.3)
- "Show Overlay" checkbox
- Color legend showing red/green meaning

**Import for Analysis:**
- File upload button: "Import Pattern to Analyze"
- Supported formats: PNG, JPEG, PDF (extract image from PDF)
- Load image into analysis canvas
- Apply same darkness analysis algorithm
- Use case: Analyze existing halftone screens from other sources

### 2.4 Pattern Generation Parameters (existing)

- Pattern type selector: Hilbert Curve (initially)
- Iterations: 1-8 (default 5)
- Line width: 0.5-10.0 (default 2.0)
- Invert: checkbox (default false)

---

## 3. Technical Design

### 3.1 Architecture

```
┌─────────────────────────────────────────────────────┐
│                  UI Layer (index.html)               │
│  - Size input controls (pixel vs physical+DPI)      │
│  - Export format selector                           │
│  - Analysis controls (radius, thresholds)           │
│  - Pattern canvas + Analysis overlay canvas         │
└─────────────────────────┬───────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────┐
│           App Controller (app.js)                    │
│  - Size calculation logic                           │
│  - Export orchestration (PNG/PDF)                   │
│  - Analysis orchestration                           │
└────────┬────────────────┬──────────────┬────────────┘
         │                │              │
         ▼                ▼              ▼
┌────────────────┐ ┌─────────────┐ ┌──────────────────┐
│ Pattern Worker │ │  PDF Module │ │ Analysis Worker  │
│ (existing)     │ │  (jsPDF)    │ │  (new)           │
└────────────────┘ └─────────────┘ └──────────────────┘
```

### 3.2 Data Structures

**Size Configuration:**
```javascript
const SizeConfig = {
  mode: 'pixel' | 'physical',

  // Pixel mode
  widthPx: number,
  heightPx: number,

  // Physical mode
  widthPhysical: number,
  heightPhysical: number,
  unit: 'in' | 'mm',
  dpi: number,

  // Calculated (always available)
  finalWidthPx: number,
  finalHeightPx: number
};
```

**Analysis Configuration:**
```javascript
const AnalysisConfig = {
  radiusInches: number,       // e.g., 0.125 for 1/8"
  radiusPixels: number,       // calculated from radiusInches * DPI
  upperThreshold: number,     // e.g., 0.7
  lowerThreshold: number,     // e.g., 0.3
  showOverlay: boolean
};
```

**Analysis Result:**
```javascript
const AnalysisResult = {
  width: number,
  height: number,
  darknessMap: Float32Array,  // 2D array as 1D (darkness ratio per pixel/grid)
  stats: {
    meanDarkness: number,
    tooDarkPixels: number,
    tooLightPixels: number,
    balancedPixels: number,
    percentTooDark: number,
    percentTooLight: number,
    percentBalanced: number
  }
};
```

### 3.3 Key Algorithms

#### Size Calculation
```javascript
function calculatePixelDimensions(config) {
  if (config.mode === 'pixel') {
    return {
      width: config.widthPx,
      height: config.heightPx
    };
  } else {
    // Physical mode
    const dpi = config.dpi;
    let widthInches = config.widthPhysical;
    let heightInches = config.heightPhysical;

    if (config.unit === 'mm') {
      widthInches = config.widthPhysical / 25.4;
      heightInches = config.heightPhysical / 25.4;
    }

    return {
      width: Math.round(widthInches * dpi),
      height: Math.round(heightInches * dpi)
    };
  }
}
```

#### Darkness Analysis (Worker)
```javascript
// analysis-worker.js
function analyzeDarkness(imageData, config) {
  const { width, height } = imageData;
  const radius = config.radiusPixels;
  const data = imageData.data;

  // Create darkness map (one value per pixel or grid cell)
  const darknessMap = new Float32Array(width * height);

  // For performance: sample every Nth pixel (adaptive based on radius)
  const stride = Math.max(1, Math.floor(radius / 4));

  let stats = {
    tooDark: 0,
    tooLight: 0,
    balanced: 0,
    totalDarkness: 0
  };

  for (let y = 0; y < height; y += stride) {
    for (let x = 0; x < width; x += stride) {
      const darkness = calculateLocalDarkness(data, width, height, x, y, radius);

      // Store in map
      const idx = y * width + x;
      darknessMap[idx] = darkness;

      // Update stats
      stats.totalDarkness += darkness;
      if (darkness > config.upperThreshold) {
        stats.tooDark++;
      } else if (darkness < config.lowerThreshold) {
        stats.tooLight++;
      } else {
        stats.balanced++;
      }

      // Progress update every N pixels
      if ((x + y * width) % 10000 === 0) {
        postMessage({
          type: 'progress',
          progress: (y * width + x) / (width * height)
        });
      }
    }
  }

  return { darknessMap, stats };
}

function calculateLocalDarkness(data, width, height, cx, cy, radius) {
  let darkCount = 0;
  let totalCount = 0;
  const radiusSq = radius * radius;

  // Bounding box
  const xMin = Math.max(0, cx - radius);
  const xMax = Math.min(width - 1, cx + radius);
  const yMin = Math.max(0, cy - radius);
  const yMax = Math.min(height - 1, cy + radius);

  for (let y = yMin; y <= yMax; y++) {
    for (let x = xMin; x <= xMax; x++) {
      // Check if in circle
      const dx = x - cx;
      const dy = y - cy;
      if (dx * dx + dy * dy <= radiusSq) {
        const idx = (y * width + x) * 4;
        const gray = data[idx]; // R channel (grayscale)

        totalCount++;
        if (gray < 128) {
          darkCount++;
        }
      }
    }
  }

  return totalCount > 0 ? darkCount / totalCount : 0;
}
```

#### Overlay Visualization
```javascript
function generateOverlay(darknessMap, width, height, config) {
  const overlayCanvas = document.createElement('canvas');
  overlayCanvas.width = width;
  overlayCanvas.height = height;
  const ctx = overlayCanvas.getContext('2d');
  const overlayData = ctx.createImageData(width, height);

  for (let i = 0; i < darknessMap.length; i++) {
    const darkness = darknessMap[i];
    const idx = i * 4;

    if (darkness > config.upperThreshold) {
      // Too dark - red overlay
      const intensity = Math.min(1, (darkness - config.upperThreshold) / (1 - config.upperThreshold));
      overlayData.data[idx] = 255;         // R
      overlayData.data[idx + 1] = 0;       // G
      overlayData.data[idx + 2] = 0;       // B
      overlayData.data[idx + 3] = intensity * 128; // A (50% max)
    } else if (darkness < config.lowerThreshold) {
      // Too light - green overlay
      const intensity = Math.min(1, (config.lowerThreshold - darkness) / config.lowerThreshold);
      overlayData.data[idx] = 0;           // R
      overlayData.data[idx + 1] = 255;     // G
      overlayData.data[idx + 2] = 0;       // B
      overlayData.data[idx + 3] = intensity * 128; // A
    } else {
      // Balanced - transparent
      overlayData.data[idx + 3] = 0;
    }
  }

  ctx.putImageData(overlayData, 0, 0);
  return overlayCanvas;
}
```

#### PDF Export
```javascript
import jsPDF from 'jspdf';

function exportToPDF(canvas, metadata) {
  // Calculate page size in mm (jsPDF uses mm)
  const widthMM = (metadata.widthPx / metadata.dpi) * 25.4;
  const heightMM = (metadata.heightPx / metadata.dpi) * 25.4;

  // Create PDF with custom page size
  const pdf = new jsPDF({
    orientation: widthMM > heightMM ? 'landscape' : 'portrait',
    unit: 'mm',
    format: [widthMM, heightMM]
  });

  // Convert canvas to data URL
  const imgData = canvas.toDataURL('image/png', 1.0);

  // Add image to PDF (full page)
  pdf.addImage(imgData, 'PNG', 0, 0, widthMM, heightMM);

  // Add metadata as PDF properties
  pdf.setProperties({
    title: `Halftonish - ${metadata.patternType}`,
    subject: `SDF Halftone Pattern`,
    author: 'Halftonish',
    keywords: metadata.patternType,
    creator: 'Halftonish Web App'
  });

  // Add text metadata on separate page (optional)
  pdf.addPage();
  pdf.setFontSize(12);
  pdf.text(`Pattern Type: ${metadata.patternType}`, 10, 10);
  pdf.text(`Iterations: ${metadata.iterations}`, 10, 20);
  pdf.text(`Line Width: ${metadata.lineWidth}`, 10, 30);
  pdf.text(`Dimensions: ${metadata.widthPx}x${metadata.heightPx} pixels`, 10, 40);
  if (metadata.dpi) {
    pdf.text(`DPI: ${metadata.dpi}`, 10, 50);
    pdf.text(`Physical Size: ${metadata.physicalWidth} x ${metadata.physicalHeight} ${metadata.unit}`, 10, 60);
  }
  pdf.text(`Generated: ${new Date().toISOString()}`, 10, 70);

  // Save PDF
  pdf.save(`halftonish-${metadata.patternType}-${Date.now()}.pdf`);
}
```

### 3.4 File Structure

**New Files:**
```
workers/
  └── analysis-worker.js      # Darkness analysis computation

utils/
  ├── canvas-io.js            # Extended with PDF import
  ├── pdf-export.js           # PDF generation logic
  └── size-calculator.js      # Size mode conversions

analysis/
  ├── darkness-analyzer.js    # Analysis orchestration
  └── overlay-renderer.js     # Overlay visualization
```

**Modified Files:**
```
index.html                    # New UI controls
styles.css                    # Styling for new controls
app.js                        # Integration of new features
```

### 3.5 Dependencies

**jsPDF:**
- Source: https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js
- Or: npm install jspdf (if using build step in future)
- License: MIT
- For now: Include via CDN in index.html

---

## 4. Task Breakdown

### Phase 1: Size Specification (3-4 hours)
- [ ] Task 1.1: Update HTML with size mode toggle and input controls
- [ ] Task 1.2: Create size-calculator.js utility module
- [ ] Task 1.3: Update app.js to handle size mode switching
- [ ] Task 1.4: Add validation for size inputs
- [ ] Task 1.5: Display calculated pixel dimensions
- [ ] Task 1.6: Update pattern generation to use calculated dimensions

### Phase 2: PDF Export (2-3 hours)
- [ ] Task 2.1: Add jsPDF library to index.html
- [ ] Task 2.2: Create pdf-export.js module
- [ ] Task 2.3: Add PDF export format option to UI
- [ ] Task 2.4: Implement PDF generation with image embedding
- [ ] Task 2.5: Add metadata to PDF
- [ ] Task 2.6: Test PDF export with various sizes

### Phase 3: Darkness Analysis Algorithm (4-5 hours)
- [ ] Task 3.1: Create analysis-worker.js
- [ ] Task 3.2: Implement circular region sampling
- [ ] Task 3.3: Implement darkness calculation
- [ ] Task 3.4: Add progress reporting
- [ ] Task 3.5: Return analysis results and statistics
- [ ] Task 3.6: Optimize for large images (adaptive sampling)

### Phase 4: Analysis UI and Visualization (3-4 hours)
- [ ] Task 4.1: Add analysis controls to HTML (radius, thresholds)
- [ ] Task 4.2: Create overlay canvas in UI
- [ ] Task 4.3: Implement overlay rendering (red/green visualization)
- [ ] Task 4.4: Add overlay toggle
- [ ] Task 4.5: Display analysis statistics
- [ ] Task 4.6: Create color legend

### Phase 5: Import for Analysis (2-3 hours)
- [ ] Task 5.1: Add file upload control for pattern import
- [ ] Task 5.2: Extend canvas-io.js to handle uploads
- [ ] Task 5.3: Support PDF image extraction (use pdf.js library)
- [ ] Task 5.4: Load imported image to analysis canvas
- [ ] Task 5.5: Run analysis on imported image
- [ ] Task 5.6: Display results same as generated patterns

### Phase 6: Integration and Polish (2-3 hours)
- [ ] Task 6.1: Wire all components together in app.js
- [ ] Task 6.2: Add loading states and progress bars
- [ ] Task 6.3: Error handling and validation
- [ ] Task 6.4: Responsive design updates
- [ ] Task 6.5: Add help text / tooltips
- [ ] Task 6.6: Final UI polish

**Total Estimated Time:** 16-22 hours

---

## 5. Dependencies

### Feature Dependencies:
- **F2 (Hilbert Curve Pattern):** Needed to have an actual pattern to generate and analyze
  - Can proceed with F1 infrastructure, but full testing requires F2

### External Dependencies:
- jsPDF library (v2.5.1+)
- PDF.js library (for PDF import) - optional, can defer

### Browser APIs:
- Canvas API (existing)
- File API (existing)
- Blob API (existing)

---

## 6. Testing Plan

### 6.1 Unit Testing (Manual)

**Size Calculation:**
- Test pixel mode: 1000x1000px → should generate 1000x1000
- Test physical mode: 8.5"x11" @ 300dpi → should generate 2550x3300
- Test unit conversion: 25.4mm @ 300dpi → should equal 1" @ 300dpi = 300px
- Test validation: Reject dimensions > 4096px
- Test edge cases: Very small DPI (72), very large DPI (600)

**PDF Export:**
- Generate pattern, export to PDF
- Open PDF: Verify image is embedded correctly
- Check PDF metadata
- Test various sizes (small, medium, large)
- Test both pixel and physical mode exports

**Darkness Analysis:**
- Generate test pattern with known distribution
- Verify analysis identifies dark/light regions correctly
- Test different radii (1/16", 1/8", 1/4")
- Test threshold adjustments
- Test with imported patterns

**Import:**
- Import PNG halftone screen
- Verify analysis runs correctly
- Import PDF with pattern (if PDF.js integrated)
- Test error handling for invalid files

### 6.2 Integration Testing

**End-to-End Workflows:**
1. Set size in pixels → generate pattern → export PNG → verify file
2. Set size in inches+DPI → generate pattern → export PDF → verify file
3. Generate pattern → analyze darkness → adjust thresholds → verify overlay
4. Import pattern → analyze → verify results
5. Switch between size modes → verify calculations update correctly

### 6.3 Cross-Browser Testing

**Browsers:**
- Chrome 90+ (primary)
- Firefox 88+
- Safari 14+
- Edge 90+

**Test:**
- Size calculations work correctly
- PDF generation works (jsPDF compatibility)
- Analysis worker performs well
- Canvas rendering is accurate

### 6.4 Performance Testing

**Benchmarks:**
- 1000x1000px pattern generation: <2s
- 2550x3300px (8.5x11@300dpi) pattern generation: <5s
- Darkness analysis on 1000x1000px: <3s
- Darkness analysis on 2550x3300px: <8s
- PDF export: <2s for any size

**Memory:**
- Monitor memory usage for large patterns (4K)
- Ensure workers are terminated and cleaned up
- No memory leaks after multiple generations

### 6.5 Edge Cases

- Maximum dimensions (4096x4096)
- Minimum dimensions (256x256)
- Non-square dimensions (e.g., 1000x500)
- Very high DPI (600dpi) with large physical size
- Analysis with very small radius
- Analysis with very large radius
- Imported patterns with unusual aspect ratios

---

## 7. Acceptance Criteria

### Must Have:
✓ Size can be specified in pixels (width x height)
✓ Size can be specified in physical dimensions + DPI
✓ Units toggle between inches and millimeters
✓ Pattern exports to PNG (grayscale 8-bit)
✓ Pattern exports to PDF with embedded image
✓ PDF includes metadata (pattern type, parameters, size, DPI)
✓ Darkness analysis tool available
✓ Analysis uses configurable radius (default 1/8")
✓ Analysis shows red overlay for too-dark areas
✓ Analysis shows green overlay for too-light areas
✓ Analysis thresholds are adjustable
✓ Can import PNG patterns for analysis
✓ UI is responsive and intuitive
✓ Progress indicators for long operations
✓ Works in all major browsers

### Should Have:
- PDF import for analysis (using PDF.js)
- Analysis statistics display (% too dark, % too light, etc.)
- Downloadable analysis report
- Preset size templates (Letter, A4, 4x6, etc.)

### Could Have:
- Batch analysis of multiple patterns
- Comparison view (side-by-side patterns)
- Analysis heatmap export
- Custom DPI presets (72, 150, 300, 600)

---

## 8. Documentation Plan

### Code Documentation:
- JSDoc comments for all new functions
- Explain size calculation logic
- Document analysis algorithm
- Document PDF generation process

### User Documentation:
- README.md: Add section on size specification options
- README.md: Add section on darkness analysis tool
- README.md: Add examples with screenshots (when feature complete)

### Inline Help:
- Tooltips on size inputs explaining pixel vs physical modes
- Tooltip on analysis radius explaining 1/8" recommendation
- Help text explaining red/green overlay meaning
- Example size presets in UI

---

## 9. Success Metrics

- Users can successfully generate patterns in both size modes
- PDF exports are high quality and include metadata
- Darkness analysis correctly identifies problematic areas
- No performance issues with 4K patterns
- Positive user feedback on analysis tool utility
- Zero critical bugs after one week in production

---

## 10. Open Questions

1. Should we support other page sizes for PDF (Letter, A4, custom)?
   - **Decision pending**: Start with exact pattern dimensions, add presets later

2. Should darkness analysis run automatically after generation?
   - **Decision pending**: Make it opt-in (button), not automatic (performance)

3. Should we support PDF import for analysis (requires PDF.js)?
   - **Decision pending**: Nice to have, defer to v2 if time constrained

4. What's the ideal default for darkness thresholds?
   - **Tentative**: 0.3 (lower), 0.7 (upper) - adjust based on testing

5. Should we allow exporting the analysis overlay as a separate image?
   - **Decision pending**: Useful for documentation, add if time permits

---

## 11. Implementation Notes

- Start with Phase 1 (Size Specification) as it's foundational
- Phases 1-2 can be done independently of F2 (Hilbert Curve)
- Phases 3-5 (Analysis) require a pattern to analyze, so coordinate with F2
- Use feature flags in code to enable/disable features during development
- Commit frequently with descriptive messages following SDLC format
- Test incrementally after each phase

---

## 12. Rollout Plan

1. Implement Phase 1-2 (Size + PDF Export) first → commit
2. Test size specification thoroughly → commit
3. Implement Phase 3 (Analysis Algorithm) → commit
4. Implement Phase 4 (Analysis UI) → commit
5. Implement Phase 5 (Import) → commit
6. Integration testing → fix bugs → commit
7. Documentation → commit
8. Mark feature as DONE → commit

---

**Planning Document Version:** 1.0
**Last Updated:** 2025-01-XX
**Next Review:** After Phase 2 completion
