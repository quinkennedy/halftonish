# Halftonish Feature List

## Feature Prioritization

Features are categorized using MoSCoW method:
- **Must Have:** Critical for MVP
- **Should Have:** Important but not critical
- **Could Have:** Desirable enhancements
- **Won't Have (Yet):** Future considerations

---

## Must Have Features (MVP)

### F1: Generate SDF Pattern Images
**Priority:** P0
**Sprint:** 1-2

**Description:**
Generate grayscale images of signed distance field patterns that can be exported and used for halftoning.

**User Stories:**
- As a user, I want to generate a Hilbert curve pattern at a specified resolution
- As a user, I want to save the pattern as a PNG file
- As a user, I want to specify the line width and iterations

**Acceptance Criteria:**
- Can generate patterns at resolutions from 256x256 to 4096x4096
- Output is grayscale PNG with values 0-255
- Line width and iterations are configurable
- Generation completes in <5s for 4K resolution

**Technical Notes:**
- Use NumPy for efficient array operations
- Implement coordinate normalization
- Support square dimensions initially

---

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
- Supports common formats (JPEG, PNG, TIFF)
- Automatic pattern scaling to image size
- Preserves aspect ratio
- Output quality comparable to input
- Processing time <5s for 4K images

**Technical Notes:**
- Convert RGB to grayscale
- Resize pattern to match image
- Threshold-based halftoning initially

---

### F4: Command-Line Interface
**Priority:** P0
**Sprint:** 4

**Description:**
User-friendly CLI for all operations with clear help and error messages.

**User Stories:**
- As a user, I want to run commands from my terminal
- As a user, I want helpful error messages when I make mistakes
- As a user, I want to see available options with `--help`

**Acceptance Criteria:**
- `halftonish generate` command works
- `halftonish apply` command works
- `--help` shows clear documentation
- Error messages are actionable
- Version information available

**Commands:**
```bash
halftonish generate <pattern> [options]
halftonish apply <pattern> --input <file> [options]
halftonish list-patterns
halftonish --version
halftonish --help
```

**Technical Notes:**
- Use Click or Typer framework
- Implement command groups
- Add progress bars for long operations

---

### F5: Basic Image I/O
**Priority:** P0
**Sprint:** 3

**Description:**
Load and save images in common formats with proper error handling.

**User Stories:**
- As a user, I want to load JPEG and PNG images
- As a user, I want clear errors if my file doesn't exist
- As a user, I want to save outputs in different formats

**Acceptance Criteria:**
- Load PNG, JPEG
- Save PNG, JPEG
- File not found errors are clear
- Corrupt image handling
- Format auto-detection

**Technical Notes:**
- Use Pillow (PIL) library
- Validate file paths
- Handle color space conversions

---

## Should Have Features

### F6: Peano Curve Pattern
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

### F7: Z-Order (Morton) Curve Pattern
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

### F8: Pattern Inversion
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

### F9: Antialiasing Control
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

### F10: Configuration File Support
**Priority:** P1
**Sprint:** 4

**Description:**
Load settings from YAML/JSON config file for complex setups.

**User Stories:**
- As a user, I want to save my preferred settings
- As a user, I want to reuse configurations
- As a power user, I want batch processing configs

**Acceptance Criteria:**
- Supports YAML and JSON
- CLI args override config file
- Schema validation
- Example configs provided

**Example Config:**
```yaml
pattern:
  type: hilbert
  iterations: 6
  line_width: 2.0

output:
  format: png
  dpi: 300
```

---

### F11: Non-Square Dimensions
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

### F12: Contrast and Brightness Adjustment
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

## Could Have Features

### F13: Multiple Halftone Methods
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

### F14: Gosper/Flowsnake Curve Pattern
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

### F15: Pattern Preview
**Priority:** P2
**Sprint:** 5

**Description:**
Quick preview at low resolution before generating full size.

**User Stories:**
- As a user, I want to preview before waiting for full render
- As a user, I want to iterate quickly on parameters

**Acceptance Criteria:**
- `halftonish preview <pattern>` command
- Generates 512x512 preview quickly (<1s)
- Optional display in terminal (ASCII art) or image viewer

---

### F16: Batch Processing
**Priority:** P2
**Sprint:** 6

**Description:**
Process multiple images with same pattern/settings.

**User Stories:**
- As a user, I want to halftone a folder of images
- As a photographer, I want consistent style across a series

**Acceptance Criteria:**
- `halftonish batch --input-dir --output-dir` command
- Progress indicator
- Error handling per file
- Parallel processing option

**Technical Notes:**
- Use multiprocessing for parallelism
- Preserve filenames
- Summary report at end

---

### F17: Custom Line Color
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

### F18: Pattern Tiling/Seamless Option
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

### F19: WebP and TIFF Support
**Priority:** P2
**Sprint:** 5

**Description:**
Additional output format support.

**User Stories:**
- As a user, I want modern WebP format
- As a professional, I want TIFF for print quality

**Acceptance Criteria:**
- Load and save WebP
- Load and save TIFF
- Proper quality/compression settings

---

### F20: Verbose/Debug Mode
**Priority:** P2
**Sprint:** 4

**Description:**
Detailed logging for troubleshooting.

**User Stories:**
- As a developer, I want to see what's happening
- As a user, I want to debug issues

**Acceptance Criteria:**
- `--verbose` flag
- `--debug` flag for extra detail
- Logs timing information
- Logs parameter values

---

## Won't Have (Yet) - Future Considerations

### F21: Real-Time GUI
**Priority:** P3
**Future**

**Description:**
Graphical interface with live preview and interactive parameter adjustment.

**Notes:**
- Possible frameworks: Qt, Electron, web-based
- Requires significant additional development
- Consider after CLI is stable

---

### F22: GPU Acceleration
**Priority:** P3
**Future**

**Description:**
Use GPU for rendering large patterns and processing large images.

**Notes:**
- CUDA or OpenCL
- Significant complexity
- Evaluate if CPU performance insufficient

---

### F23: Color (CMYK) Halftoning
**Priority:** P3
**Future**

**Description:**
Separate CMYK channels for print-ready halftones.

**Notes:**
- Requires color separation logic
- Different patterns per channel
- Screen angle control

---

### F24: Video Processing
**Priority:** P3
**Future**

**Description:**
Apply halftone to video, frame by frame.

**Notes:**
- FFmpeg integration
- Temporal coherence challenges
- Performance critical

---

### F25: Web-Based Tool
**Priority:** P3
**Future**

**Description:**
Browser-based version for accessibility.

**Notes:**
- WebAssembly compilation
- JavaScript implementation
- Cloud processing option

---

### F26: Custom Pattern Editor
**Priority:** P3
**Future**

**Description:**
Visual tool to create custom SDF patterns.

**Notes:**
- Node-based or code-based editor
- Pattern language/DSL
- Save/share custom patterns

---

### F27: Machine Learning Integration
**Priority:** P3
**Future**

**Description:**
AI-powered pattern suggestion or generation.

**Notes:**
- Train on pattern aesthetics
- Style transfer
- Automatic parameter tuning

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
- F4: CLI
- F5: Image I/O

### v0.2.0 - Pattern Library (Week 8)
- F6: Peano curve
- F7: Z-Order curve
- F8: Pattern inversion
- F9: Antialiasing
- F10: Config files

### v0.3.0 - Refinement (Week 10)
- F11: Non-square dimensions
- F12: Contrast/brightness
- F13: Multiple methods
- F15: Preview
- F20: Verbose mode

### v0.4.0 - Advanced Features (Week 12)
- F14: Gosper curve
- F16: Batch processing
- F17: Custom colors
- F18: Seamless tiling
- F19: WebP/TIFF

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
| F1 (Generate) | Performance | <1s for 1000px, <5s for 4K |
| F2 (Hilbert) | Quality | Smooth lines, no artifacts |
| F3 (Apply) | Performance | <5s for 4K image |
| F4 (CLI) | Usability | <5 clicks to basic task |
| F5 (I/O) | Compatibility | 99% of common images load |
| F16 (Batch) | Throughput | >10 images/min (4K) |
