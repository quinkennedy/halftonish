# Halftonish Architecture

## System Overview

Halftonish is designed as a modular pipeline for generating and applying SDF-based halftone patterns. The architecture follows a plugin-style pattern for extensibility.

```
┌─────────────────────────────────────────────────────────────┐
│                        CLI Interface                         │
│                    (Command Processing)                      │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                    Configuration Layer                       │
│              (Parameters, Settings, Validation)              │
└────────────────────────┬────────────────────────────────────┘
                         │
         ┌───────────────┴───────────────┐
         ▼                               ▼
┌──────────────────────┐      ┌──────────────────────┐
│   Pattern Generator   │      │   Image Processor    │
│    (SDF Renderer)     │      │   (Halftone Apply)   │
└──────────┬───────────┘      └──────────┬───────────┘
           │                              │
           ▼                              ▼
┌──────────────────────┐      ┌──────────────────────┐
│   Pattern Library     │      │   Image I/O Layer    │
│  (SDF Definitions)    │      │  (Load/Save Images)  │
└──────────────────────┘      └──────────────────────┘
```

## Core Components

### 1. CLI Interface
**Responsibility:** User interaction, command parsing, orchestration

**Key Functions:**
- Parse command-line arguments
- Validate user input
- Route commands to appropriate modules
- Display help and documentation
- Handle errors gracefully

**Technologies:** Click or Typer (Python)

**Example Commands:**
```bash
# Generate a pattern
halftonish generate hilbert --size 1000 --output pattern.png

# Apply halftone to image
halftonish apply hilbert --input photo.jpg --output halftoned.png

# List available patterns
halftonish list-patterns

# Show pattern preview
halftonish preview hilbert --size 500
```

---

### 2. Configuration Layer
**Responsibility:** Parameter management and validation

**Components:**
- **ConfigParser:** Load settings from files (YAML/JSON)
- **ParameterValidator:** Ensure parameters are valid
- **DefaultsManager:** Provide sensible defaults

**Configuration Schema:**
```yaml
pattern:
  type: hilbert
  size: 1000
  iterations: 5
  invert: false

rendering:
  antialiasing: true
  supersampling: 2

halftone:
  method: threshold
  contrast: 1.0
  brightness: 0.0

output:
  format: png
  bit_depth: 8
  dpi: 300
```

---

### 3. SDF Renderer
**Responsibility:** Generate signed distance fields for patterns

**Core Architecture:**
```python
class SDFRenderer:
    """Base renderer for SDF patterns"""

    def render(self, width: int, height: int,
               pattern: SDFPattern) -> np.ndarray:
        """
        Render an SDF pattern to a grayscale array

        Returns: 2D numpy array with values in [0, 1]
        """
        pass

    def normalize_coordinates(self, width: int,
                            height: int) -> np.ndarray:
        """Create normalized coordinate grid"""
        pass

    def apply_antialiasing(self, sdf: np.ndarray) -> np.ndarray:
        """Smooth the SDF for better visual quality"""
        pass
```

**Key Algorithms:**
- Coordinate normalization (pixel → [0,1] space)
- SDF evaluation across grid
- Distance field normalization
- Antialiasing via gradient-based smoothing

**Performance Considerations:**
- Vectorized NumPy operations for speed
- Optional Numba JIT compilation for hot paths
- Lazy evaluation where possible

---

### 4. Pattern Library
**Responsibility:** Define SDF patterns (space-filling curves, etc.)

**Pattern Interface:**
```python
from abc import ABC, abstractmethod

class SDFPattern(ABC):
    """Base class for all SDF patterns"""

    @abstractmethod
    def sdf(self, x: np.ndarray, y: np.ndarray) -> np.ndarray:
        """
        Compute signed distance field

        Args:
            x, y: Normalized coordinates in [0, 1]

        Returns:
            Signed distance values (negative = inside)
        """
        pass

    @abstractmethod
    def name(self) -> str:
        """Pattern identifier"""
        pass

    def parameters(self) -> dict:
        """Adjustable parameters"""
        return {}
```

**Initial Patterns:**

1. **Hilbert Curve**
   - Recursive space-filling curve
   - Parameters: iterations, line_width, spacing
   - SDF: Distance to nearest curve segment

2. **Peano Curve**
   - Alternative space-filling curve
   - Parameters: iterations, line_width

3. **Z-Order (Morton) Curve**
   - Simpler space-filling pattern
   - Parameters: iterations, line_width

4. **Gosper Curve**
   - Hexagonal space-filling curve
   - Parameters: iterations, line_width

**Pattern Implementation Strategy:**
- Generate curve points via recursive algorithm
- Convert to line segments
- Compute distance field to segments
- Apply width/thickness parameter

---

### 5. Image Processor
**Responsibility:** Apply halftone patterns to images

**Core Algorithm:**
```python
class HalftoneProcessor:
    def apply_halftone(self,
                      image: np.ndarray,
                      pattern: np.ndarray,
                      method: str = 'threshold') -> np.ndarray:
        """
        Apply halftone pattern to image

        Args:
            image: Input image (grayscale or RGB)
            pattern: SDF pattern (grayscale, values in [0,1])
            method: 'threshold', 'dither', or 'blend'

        Returns:
            Halftoned image
        """
        pass
```

**Halftone Methods:**

1. **Threshold Method:**
   - Compare image intensity to pattern value
   - Output black/white based on comparison
   - Fast, high contrast

2. **Dither Method:**
   - Use pattern as dither matrix
   - Error diffusion variant
   - Smoother gradients

3. **Blend Method:**
   - Multiply image by pattern
   - Preserve some grayscale
   - More subtle effect

**Image Processing Pipeline:**
```
Input Image
    │
    ├─→ Convert to grayscale (if RGB)
    │
    ├─→ Resize pattern to match image dimensions
    │
    ├─→ Normalize intensities
    │
    ├─→ Apply halftone method
    │
    ├─→ Post-processing (contrast, levels)
    │
    ▼
Output Image
```

---

### 6. Image I/O Layer
**Responsibility:** Load and save images

**Supported Formats:**
- PNG (lossless, preferred for patterns)
- JPEG (lossy, for photos)
- TIFF (high quality, large files)
- WebP (modern compression)

**Implementation:**
```python
class ImageIO:
    @staticmethod
    def load(path: str) -> np.ndarray:
        """Load image as numpy array"""
        pass

    @staticmethod
    def save(path: str, image: np.ndarray,
             format: str = 'png', **kwargs):
        """Save numpy array as image"""
        pass

    @staticmethod
    def get_format_options(format: str) -> dict:
        """Get valid options for format"""
        pass
```

**Error Handling:**
- Validate file exists
- Check format support
- Handle corrupt images
- Provide clear error messages

---

## Data Flow Diagrams

### Pattern Generation Flow
```
User Command
    │
    ├─→ Parse CLI args
    │
    ├─→ Load configuration
    │
    ├─→ Select pattern from library
    │
    ├─→ Create SDF renderer
    │
    ├─→ Generate coordinate grid
    │
    ├─→ Evaluate SDF function
    │
    ├─→ Normalize to [0, 255]
    │
    ├─→ Apply antialiasing
    │
    ├─→ Save as image
    │
    ▼
Output Pattern File
```

### Halftone Application Flow
```
User Command + Input Image + Pattern Type
    │
    ├─→ Load input image
    │
    ├─→ Generate pattern (matching dimensions)
    │
    ├─→ Convert image to grayscale
    │
    ├─→ Apply halftone algorithm
    │
    ├─→ Post-process
    │
    ├─→ Save result
    │
    ▼
Halftoned Output Image
```

---

## Extensibility Points

### Adding New Patterns
1. Create class inheriting from `SDFPattern`
2. Implement `sdf()` method
3. Register in pattern library
4. Add unit tests
5. Update documentation

### Adding New Halftone Methods
1. Implement method in `HalftoneProcessor`
2. Add to method registry
3. Update CLI options
4. Add tests and examples

### Plugin System (Future)
- Discover patterns from external modules
- Load via entry points or config
- Validate plugin interface
- Sandbox execution

---

## Testing Strategy

### Unit Tests
- Each pattern's SDF function
- Renderer normalization
- Image I/O functions
- Configuration parsing

### Integration Tests
- End-to-end pattern generation
- Full halftone pipeline
- CLI command execution
- Cross-format compatibility

### Visual Tests
- Generate reference images
- Compare against known-good outputs
- Detect visual regressions
- Perceptual difference metrics

### Performance Tests
- Benchmark pattern generation
- Profile memory usage
- Test with various image sizes
- Identify bottlenecks

---

## Security Considerations

- Validate all file paths (prevent directory traversal)
- Limit image dimensions (prevent DoS)
- Sanitize configuration input
- Handle malformed images safely
- Resource limits (memory, CPU time)

---

## Deployment Architecture

### Package Structure
```
halftonish/
├── __init__.py
├── cli.py              # Command-line interface
├── config.py           # Configuration management
├── renderer.py         # SDF renderer
├── patterns/           # Pattern library
│   ├── __init__.py
│   ├── base.py         # SDFPattern base class
│   ├── hilbert.py
│   ├── peano.py
│   └── zorder.py
├── processor.py        # Image processing
├── io.py               # Image I/O
└── utils.py            # Utilities

tests/
├── test_patterns.py
├── test_renderer.py
├── test_processor.py
└── fixtures/           # Test images

examples/
├── generate_patterns.py
└── apply_halftone.py

docs/
├── api/
├── tutorials/
└── patterns/
```

### Distribution
- PyPI package for pip installation
- Docker image for containerized usage
- GitHub releases with standalone binaries (PyInstaller)

---

## Performance Targets

| Operation | Target | Notes |
|-----------|--------|-------|
| Generate 1000x1000 pattern | <1s | On modern CPU |
| Generate 4000x4000 pattern | <5s | 4K resolution |
| Apply halftone to 4K image | <5s | Full pipeline |
| Memory usage | <500MB | For 4K images |
| Startup time | <100ms | CLI responsiveness |

---

## Future Enhancements

1. **GPU Acceleration:** CUDA/OpenCL for large images
2. **Real-time Preview:** GUI with live parameter adjustment
3. **Batch Processing:** Process multiple images
4. **Color Halftone:** CMYK separation
5. **Video Support:** Apply to video frames
6. **Web Interface:** Browser-based tool
7. **Pattern Editor:** Visual pattern creation
