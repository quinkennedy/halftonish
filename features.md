# Halftonish Feature List

## Feature Prioritization

Features are categorized using MoSCoW method:
- **Must Have:** Critical for MVP
- **Should Have:** Important but not critical
- **Could Have:** Desirable enhancements
- **Won't Have (Yet):** Future considerations

## Feature Status

Features move through states: **TODO → ACTIVE → DONE**

See `claude.md` for the complete SDLC workflow.

---

## ACTIVE Features

### F1.5: Simple Halftone Patterns
**Priority:** P0
**Status:** PLANNING (Started: 2025-01-19)

**Description:**
Implement three simple, immediately usable halftone patterns: Random, Noise, and Ben-Day Dots. These patterns provide functional output while more complex SDF patterns are developed, and allow testing of the complete workflow (generation → export → analysis).

**User Stories:**
- As a user, I want to generate random noise patterns for testing
- As a user, I want smooth Perlin/Simplex noise for organic textures
- As a user, I want classic Ben-Day dots for comic/pop art effects
- As a user, I want to control pattern parameters (scale, spacing, dot size)
- As a user, I want reproducible patterns using seeds

**Patterns:**
1. **Random Pattern**
   - Pure random pixels
   - Distribution types: uniform, normal, binary
   - Optional seed for reproducibility

2. **Noise Pattern**
   - Perlin/Simplex noise
   - Parameters: scale (0.1-10), octaves (1-8), persistence (0-1)
   - Smooth, continuous gradients

3. **Ben-Day Dots**
   - Regular dot grids
   - Parameters: spacing (pixels/inches), dot size (0-1)
   - Grid types: square, hexagonal
   - Dot shapes: circle, square, diamond
   - Anti-aliasing option

**Acceptance Criteria:**
- All three patterns generate correctly at all supported resolutions
- Pattern-specific parameters work as expected
- Seed produces reproducible results for random and noise
- Ben-Day dots spacing works in pixels and physical units
- All patterns export to PNG and PDF with correct metadata
- All patterns work with darkness analysis tool
- Dynamic UI shows/hides parameters based on selected pattern
- Performance: 4K generation in <5s

**Technical Notes:**
- Use simplex-noise library for noise generation
- Use seedrandom for reproducible random numbers
- Ben-Day dots use SDF approach for clean rendering
- Web Worker for all pattern generation
- Unified PatternGenerator interface

---

## DONE Features

### F1: Generate SDF Pattern Images ✓
**Priority:** P0
**Status:** DONE (Completed: 2025-01-19)

**Description:**
Generate grayscale images of signed distance field patterns that can be exported and used for halftoning. Includes flexible sizing options (pixels or physical dimensions + DPI), multiple export formats (PNG, PDF), and a darkness analysis tool to verify pattern quality.

**User Stories:**
- As a user, I want to generate a Hilbert curve pattern at a specified resolution ✓
- As a user, I want to specify size in pixels (e.g., 1000x1000px) OR physical dimensions + DPI (e.g., 8.5"x11" @ 300dpi) ✓
- As a user, I want to save the pattern as PNG or PDF ✓
- As a user, I want to specify the line width and iterations ✓
- As a user, I want to analyze pattern darkness distribution to ensure quality ✓
- As a user, I want to import existing halftone patterns to analyze them ✓

**Acceptance Criteria:**
- Can generate patterns at resolutions from 256x256 to 4096x4096 ✓
- Support pixel-based sizing (width x height in pixels) ✓
- Support physical sizing (width x height in inches/mm + DPI) ✓
- Output is grayscale PNG with values 0-255 ✓
- Export to PDF with embedded pattern ✓
- Line width and iterations are configurable ✓
- Darkness analysis tool shows red (too dark) and green (too light) overlays ✓
- Analysis uses configurable radius (default 1/8" at current DPI) ✓
- Can import patterns (PNG/PDF) for analysis ✓
- Generation completes in <5s for 4K resolution ✓

**Technical Implementation:**
- Canvas API with ImageData for pixel operations
- Coordinate normalization system
- Web Worker for non-blocking rendering
- Support for square and rectangular dimensions
- PDF generation via jsPDF library
- PDF import via PDF.js library
- Darkness analysis: circular sampling with configurable radius
- Color overlay for visualization (red/green based on local darkness)
- Real-time size calculation and validation
- Progress feedback for all operations
- Cancellation support

**Implemented Features:**
1. **Size Calculator Utility** - Dual-mode sizing (pixel/physical) with validation
2. **PDF Export** - High-quality PDF generation with metadata page
3. **Darkness Analysis Worker** - Non-blocking analysis with progress reporting
4. **Overlay Renderer** - Red/green visualization of darkness distribution
5. **Pattern Import** - Support for PNG, JPG, and PDF pattern import
6. **Analysis Controller** - Complete UI integration with event handling
7. **Help Text** - User guidance throughout interface

---

## TODO: Must Have Features (MVP)

### F2: Hilbert Curve Pattern
**Priority:** P0
**Sprint:** 1

**Description:**
Implement Hilbert space-filling curve as the first SDF pattern.

**User Stories:**
- As a user, I want to generate Hilbert curve patterns
- As a user, I want to control the recursion depth/iterations
- As a user, I want to adjust the line thickness

**Acceptance Criteria:**
- Mathematically correct Hilbert curve generation
- Iterations parameter (1-8 range)
- Line width parameter (0.1-10.0 range)
- Smooth SDF rendering without artifacts

**Technical Notes:**
- Recursive algorithm for point generation
- Distance field computation to curve segments
- Proper handling of curve endpoints

---

### F3: Apply Halftone to Image
**Priority:** P0
**Sprint:** 3

**Description:**
Load an image and apply an SDF pattern as a halftone effect, producing a processed output image.

**User Stories:**
- As a user, I want to load a photo and apply a Hilbert curve halftone
- As a user, I want to save the halftoned result
- As a user, I want the pattern to automatically match my image dimensions

**Acceptance Criteria:**
- Supports common formats (JPEG, PNG)
- Automatic pattern scaling to image size
- Preserves aspect ratio
- Output quality comparable to input
- Non-blocking UI with progress feedback

**Technical Notes:**
- Use File API for image upload
- Convert RGB to grayscale via Canvas
- Resize pattern to match image
- Threshold-based halftoning initially
- Web Worker for processing

---

### F4: Web User Interface
**Priority:** P0
**Sprint:** 4

**Description:**
User-friendly web interface for all operations with clear visual feedback and controls.

**User Stories:**
- As a user, I want to generate patterns in my browser
- As a user, I want helpful error messages when I make mistakes
- As a user, I want intuitive controls with sliders and buttons
- As a user, I want to see my pattern and results immediately

**Acceptance Criteria:**
- Pattern generation UI works with all controls
- Image upload and halftone application works
- Responsive design works on desktop and mobile
- Error messages are clear and actionable
- Downloads work for both patterns and results

**UI Elements:**
- Pattern selection dropdown
- Parameter sliders (iterations, line width, size)
- Generate and Cancel buttons
- File upload button
- Canvas preview areas
- Download buttons

**Technical Notes:**
- Vanilla JavaScript with ES6 modules
- CSS Grid/Flexbox for layout
- Event-driven architecture
- Mobile-responsive design

---

### F5: Browser Image I/O
**Priority:** P0
**Sprint:** 3

**Description:**
Load and save images in the browser using Canvas API and File API.

**User Stories:**
- As a user, I want to upload JPEG and PNG images from my computer
- As a user, I want clear errors if my file is invalid
- As a user, I want to download results in PNG or JPEG format

**Acceptance Criteria:**
- Upload PNG, JPEG via file picker
- Download PNG, JPEG to user's device
- Invalid file errors are clear
- Corrupt image handling
- Format selection for download

**Technical Notes:**
- File API for uploads
- Canvas toBlob() for downloads
- Validate file types (MIME)
- Handle load errors gracefully

---

### F6: Progress Feedback
**Priority:** P0
**Sprint:** 2

**Description:**
Real-time progress updates during pattern generation and halftone application.

**User Stories:**
- As a user, I want to see progress when generating large patterns
- As a user, I want to know how long an operation will take
- As a user, I want the UI to remain responsive during processing

**Acceptance Criteria:**
- Progress bar updates smoothly during rendering
- Percentage displayed (0-100%)
- UI remains responsive (no freezing)
- Progress updates at least every 100ms

**Technical Notes:**
- Web Worker sends progress messages
- Main thread updates progress bar
- Chunked processing for granular updates
- requestAnimationFrame for smooth UI

---

### F7: Cancellation Support
**Priority:** P0
**Sprint:** 2

**Description:**
Ability to cancel long-running operations at any time.

**User Stories:**
- As a user, I want to cancel a render that's taking too long
- As a user, I want to change parameters mid-render
- As a user, I want the UI to reset after cancellation

**Acceptance Criteria:**
- Cancel button appears during operations
- Cancellation responds within 500ms
- Worker terminates cleanly
- UI resets to ready state
- No memory leaks after cancellation

**Technical Notes:**
- Shared cancellation token object
- Worker checks token periodically
- Terminate worker on cancel
- Clean up resources properly

---

## TODO: Should Have Features

### F8: Peano Curve Pattern
**Priority:** P1
**Sprint:** 2

**Description:**
Implement Peano space-filling curve as second pattern option.

**User Stories:**
- As a user, I want to choose Peano curve instead of Hilbert
- As a user, I want the same controls (iterations, width)

**Acceptance Criteria:**
- Correct Peano curve mathematics
- Same parameter interface as Hilbert
- Visual quality comparable to Hilbert

---

### F9: Z-Order (Morton) Curve Pattern
**Priority:** P1
**Sprint:** 2

**Description:**
Implement Z-order/Morton curve pattern.

**User Stories:**
- As a user, I want to use simpler Z-order curves
- As a user, I want faster generation for simple patterns

**Acceptance Criteria:**
- Correct Z-order curve
- Faster than Hilbert (simpler algorithm)
- Same parameter interface

---

### F10: Pattern Inversion
**Priority:** P1
**Sprint:** 2

**Description:**
Option to invert patterns (swap black/white).

**User Stories:**
- As a user, I want to invert my pattern
- As a user, I want to try both positive and negative versions

**Acceptance Criteria:**
- `--invert` flag available
- Works for all patterns
- Maintains quality

**Technical Notes:**
- Simple: `inverted = 1.0 - pattern`

---

### F11: Antialiasing Control
**Priority:** P1
**Sprint:** 2

**Description:**
Control over antialiasing quality for smoother or sharper patterns.

**User Stories:**
- As a user, I want smooth patterns with antialiasing
- As a user, I want sharp patterns without antialiasing
- As a power user, I want to control AA strength

**Acceptance Criteria:**
- `--antialiasing` flag (on/off)
- Optional `--aa-strength` parameter
- Visible quality difference
- Minimal performance impact

**Technical Notes:**
- Gradient-based smoothing
- Supersampling option
- Default: antialiasing enabled

---

### F12: URL Parameter Configuration
**Priority:** P1
**Sprint:** 4

**Description:**
Load settings from URL parameters for sharing and bookmarking.

**User Stories:**
- As a user, I want to share my pattern settings via URL
- As a user, I want to bookmark my favorite configurations
- As a power user, I want to link directly to specific patterns

**Acceptance Criteria:**
- Supports URL query parameters
- Parameters update UI on page load
- Share button generates shareable URL
- Invalid parameters show helpful errors

**Example URL:**
```
https://example.com/halftonish?pattern=hilbert&iterations=6&lineWidth=2.0&size=1000
```

---

### F13: Non-Square Dimensions
**Priority:** P1
**Sprint:** 3

**Description:**
Support rectangular output, not just square.

**User Stories:**
- As a user, I want 16:9 aspect ratio patterns
- As a user, I want patterns matching my photo dimensions

**Acceptance Criteria:**
- Accept `--width` and `--height` separately
- Pattern adapts to aspect ratio
- No distortion

**Technical Notes:**
- Adjust coordinate normalization
- Scale pattern appropriately
- May tile or crop pattern

---

### F14: Contrast and Brightness Adjustment
**Priority:** P1
**Sprint:** 3

**Description:**
Post-processing controls for halftoned images.

**User Stories:**
- As a user, I want to boost contrast in my halftone
- As a user, I want to adjust brightness
- As a user, I want fine control over the look

**Acceptance Criteria:**
- `--contrast` parameter (-1.0 to 1.0)
- `--brightness` parameter (-1.0 to 1.0)
- Real-time preview (future)
- Preserves quality

---

## TODO: Could Have Features

### F15: Multiple Halftone Methods
**Priority:** P2
**Sprint:** 5

**Description:**
Alternative halftoning algorithms beyond basic threshold.

**Methods:**
1. Threshold (default)
2. Error diffusion dithering
3. Ordered dithering
4. Blend mode (multiplicative)

**User Stories:**
- As a user, I want dithered halftone for smoother gradients
- As a user, I want to experiment with different methods

**Acceptance Criteria:**
- `--method` parameter
- All methods work with all patterns
- Visual quality examples in docs

---

### F16: Gosper/Flowsnake Curve Pattern
**Priority:** P2
**Sprint:** 5

**Description:**
Hexagonal space-filling curve pattern.

**User Stories:**
- As a user, I want hexagonal patterns
- As a user, I want more variety in curve types

**Acceptance Criteria:**
- Correct Gosper curve mathematics
- Tiles properly
- Same interface as other patterns

---

### F17: Real-Time Parameter Preview
**Priority:** P2
**Sprint:** 5

**Description:**
Auto-generate small preview as user adjusts parameters.

**User Stories:**
- As a user, I want to see instant feedback when I change parameters
- As a user, I want to iterate quickly on pattern design
- As a user, I want low-res preview while adjusting, high-res when done

**Acceptance Criteria:**
- Small preview canvas updates as sliders move (debounced)
- Preview generates quickly (<500ms for 256x256)
- Main generate button creates full resolution
- Preview doesn't block UI

---

### F18: Batch Image Processing
**Priority:** P2
**Sprint:** 6

**Description:**
Process multiple images with same pattern/settings.

**User Stories:**
- As a user, I want to halftone multiple images at once
- As a photographer, I want consistent style across a series
- As a user, I want to drag-and-drop multiple files

**Acceptance Criteria:**
- Multiple file upload support
- Progress indicator for each image
- Error handling per file
- Download all as ZIP

**Technical Notes:**
- Process sequentially or use multiple workers
- JSZip for bundling downloads
- Individual and batch progress tracking

---

### F19: Custom Line Color
**Priority:** P2
**Sprint:** 5

**Description:**
Generate patterns with colored lines instead of black/white.

**User Stories:**
- As a designer, I want colored patterns
- As a user, I want to match my brand colors

**Acceptance Criteria:**
- `--line-color` parameter (hex or RGB)
- `--background-color` parameter
- Maintains SDF quality

---

### F20: Pattern Tiling/Seamless Option
**Priority:** P2
**Sprint:** 6

**Description:**
Generate patterns that tile seamlessly when repeated.

**User Stories:**
- As a designer, I want tileable patterns for backgrounds
- As a user, I want patterns that loop smoothly

**Acceptance Criteria:**
- `--seamless` flag
- Pattern edges match perfectly
- Works for applicable patterns (not all may support)

---

### F21: WebP Support
**Priority:** P2
**Sprint:** 5

**Description:**
Additional modern format support.

**User Stories:**
- As a user, I want modern WebP format for smaller file sizes
- As a user, I want best compression for web use

**Acceptance Criteria:**
- Load and save WebP
- Proper quality/compression settings
- Browser compatibility check

**Technical Notes:**
- Canvas toBlob supports WebP in modern browsers
- Fallback to PNG if not supported

---

### F22: Debug Console
**Priority:** P2
**Sprint:** 4

**Description:**
Detailed logging for troubleshooting via browser console.

**User Stories:**
- As a developer, I want to see what's happening
- As a user, I want to debug issues
- As a user, I want performance metrics

**Acceptance Criteria:**
- Debug mode toggle in UI or URL param
- Logs to browser console
- Timing information for operations
- Parameter values logged
- Memory usage stats

**Technical Notes:**
- console.debug(), console.time()
- Performance API for metrics
- Toggle via ?debug=true URL param

---

## TODO: Won't Have (Yet) - Future Considerations

### F23: Desktop Application
**Priority:** P3
**Future**

**Description:**
Electron-based desktop app for offline use.

**Notes:**
- Electron wrapper around web app
- Offline capability
- Native file system access
- Consider if users request it

---

### F24: GPU/WebGL Acceleration
**Priority:** P3
**Future**

**Description:**
Use WebGL/GPU for rendering large patterns and processing large images.

**Notes:**
- WebGL shaders for SDF rendering
- Significant complexity
- Evaluate if Web Worker performance insufficient
- Could enable real-time parameter adjustment at high resolution

---

### F25: Color (CMYK) Halftoning
**Priority:** P3
**Future**

**Description:**
Separate CMYK channels for print-ready halftones.

**Notes:**
- Requires color separation logic
- Different patterns per channel
- Screen angle control

---

### F26: Video Processing
**Priority:** P3
**Future**

**Description:**
Apply halftone to video, frame by frame.

**Notes:**
- FFmpeg integration
- Temporal coherence challenges
- Performance critical

---

### F27: Advanced Export Options
**Priority:** P3
**Future**

**Description:**
SVG export and high-DPI support.

**Notes:**
- Export patterns as SVG (vector format)
- Retina/high-DPI optimizations
- Print-quality DPI settings
- PDF export for print workflows

---

### F28: Custom Pattern Editor
**Priority:** P3
**Future**

**Description:**
Visual tool to create custom SDF patterns.

**Notes:**
- Node-based or code-based editor
- Pattern language/DSL
- Save/share custom patterns

---

### F29: Pattern Marketplace/Gallery
**Priority:** P3
**Future**

**Description:**
Community pattern sharing and gallery.

**Notes:**
- User-submitted patterns
- Pattern library/marketplace
- Voting and favorites
- Requires backend infrastructure

---

## Feature Dependencies

```
F4 (CLI) ← F1 (Generate)
         ← F3 (Apply)
         ← F10 (Config)

F1 (Generate) ← F2 (Hilbert)
              ← F6 (Peano)
              ← F7 (Z-Order)

F3 (Apply) ← F5 (Image I/O)
           ← F1 (Generate)
           ← F12 (Contrast/Brightness)

F13 (Methods) ← F3 (Apply)

F16 (Batch) ← F3 (Apply)
            ← F4 (CLI)
```

---

## Release Milestones

### v0.1.0 - MVP (Week 6)
- F1: Generate patterns
- F2: Hilbert curve
- F3: Apply halftone
- F4: Web UI
- F5: Browser I/O
- F6: Progress feedback
- F7: Cancellation

### v0.2.0 - Pattern Library (Week 8)
- F8: Peano curve
- F9: Z-Order curve
- F10: Pattern inversion
- F11: Antialiasing
- F12: URL parameters

### v0.3.0 - Refinement (Week 10)
- F13: Non-square dimensions
- F14: Contrast/brightness
- F15: Multiple methods
- F17: Real-time preview
- F22: Debug console

### v0.4.0 - Advanced Features (Week 12)
- F16: Gosper curve
- F18: Batch processing
- F19: Custom colors
- F20: Seamless tiling
- F21: WebP support

### v1.0.0 - Production Ready (Week 14)
- Polish and bug fixes
- Complete documentation
- Performance optimization
- Comprehensive test coverage
- Community feedback integration

---

## Success Metrics

| Feature | Metric | Target |
|---------|--------|--------|
| F1 (Generate) | Quality | Smooth patterns, no artifacts |
| F2 (Hilbert) | Correctness | Mathematically accurate curve |
| F3 (Apply) | Quality | Clean halftone results |
| F4 (Web UI) | Usability | Intuitive, mobile-friendly |
| F5 (I/O) | Compatibility | 99% of common images load |
| F6 (Progress) | Responsiveness | Updates every 100ms |
| F7 (Cancel) | Responsiveness | Responds in <500ms |
| F18 (Batch) | Throughput | Handles 10+ images smoothly |
