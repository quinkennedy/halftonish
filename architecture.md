# Halftonish Architecture

## System Overview

Halftonish is a browser-based application designed as a modular pipeline for generating and applying SDF-based halftone patterns. It runs entirely in the client browser with no server required, using Web Workers for non-blocking computation and progress feedback.

```
┌──────────────────────────────────────────────────────────────┐
│                       Web UI Layer                            │
│          (HTML, CSS, User Controls, Progress Display)         │
└────────────────────────┬─────────────────────────────────────┘
                         │
                         ▼
┌──────────────────────────────────────────────────────────────┐
│                  Application Controller                       │
│        (State Management, Event Handling, Cancellation)       │
└────────────────────────┬─────────────────────────────────────┘
                         │
         ┌───────────────┴────────────────┐
         ▼                                ▼
┌──────────────────────┐       ┌───────────────────────┐
│  Pattern Generator    │       │   Image Processor     │
│  (SDF Renderer)       │       │  (Halftone Apply)     │
│  [Web Worker]         │       │  [Web Worker]         │
└──────────┬───────────┘       └──────────┬────────────┘
           │                              │
           ▼                              ▼
┌──────────────────────┐       ┌───────────────────────┐
│  Pattern Library      │       │  Canvas I/O Layer     │
│  (SDF Functions)      │       │  (Load/Save Images)   │
└──────────────────────┘       └───────────────────────┘
```

## Core Components

### 1. Web UI Layer
**Responsibility:** User interaction, parameter controls, visual feedback

**Key Elements:**
- Pattern selection dropdown/buttons
- Parameter sliders (iterations, line width, size)
- File upload button for images
- Canvas preview areas
- Progress bars with percentage
- Cancel buttons for long operations
- Download buttons for exports

**Technologies:** HTML5, CSS3, Vanilla JavaScript

**UI Layout:**
```
┌─────────────────────────────────────────────┐
│              Halftonish                      │
├─────────────────────────────────────────────┤
│  [ Pattern: Hilbert ▼ ]                     │
│  Iterations: [====●====] 5                   │
│  Line Width: [==●======] 2.0                 │
│  Size: [=====●===] 1000x1000                 │
│  [ Generate Pattern ] [ Cancel ]             │
│                                              │
│  Progress: [████████░░] 80% Rendering...     │
│                                              │
│  ┌────────────────┐  ┌──────────────────┐  │
│  │                 │  │                   │  │
│  │  Pattern Canvas │  │  Result Canvas    │  │
│  │                 │  │                   │  │
│  └────────────────┘  └──────────────────┘  │
│  [ ⬇ Download ]      [ ⬇ Download ]        │
│                                              │
│  Or apply to image:                          │
│  [ 📁 Upload Image ] [ Apply Halftone ]     │
└─────────────────────────────────────────────┘
```

**Responsiveness:**
- Desktop: Side-by-side layout
- Tablet: Stacked vertical layout
- Mobile: Single column, smaller canvases

---

### 2. Application Controller
**Responsibility:** Orchestrate operations, manage state, handle cancellation

**Core State:**
```javascript
const AppState = {
  currentPattern: 'hilbert',
  parameters: {
    iterations: 5,
    lineWidth: 2.0,
    size: 1000,
    invert: false,
    antialiasing: true
  },
  rendering: {
    isRendering: false,
    progress: 0,
    cancelRequested: false
  },
  uploadedImage: null,
  generatedPattern: null
};
```

**Key Responsibilities:**
- Initialize UI and event listeners
- Validate user input
- Spawn and communicate with Web Workers
- Handle progress updates from workers
- Implement cancellation logic
- Update progress bars
- Enable/disable UI during operations

**Cancellation Pattern:**
```javascript
class RenderController {
  constructor() {
    this.cancelToken = { cancelled: false };
  }

  async renderPattern(pattern, params) {
    this.cancelToken.cancelled = false;
    const worker = new Worker('pattern-worker.js');

    worker.postMessage({
      type: 'render',
      pattern,
      params,
      cancelToken: this.cancelToken
    });

    return new Promise((resolve, reject) => {
      worker.onmessage = (e) => {
        if (e.data.type === 'progress') {
          this.updateProgress(e.data.progress);
        } else if (e.data.type === 'complete') {
          resolve(e.data.imageData);
          worker.terminate();
        } else if (e.data.type === 'cancelled') {
          reject(new Error('Cancelled'));
          worker.terminate();
        }
      };
    });
  }

  cancel() {
    this.cancelToken.cancelled = true;
  }
}
```

---

### 3. SDF Renderer (Web Worker)
**Responsibility:** Generate signed distance fields for patterns without blocking UI

**Core Architecture:**
```javascript
// pattern-worker.js
class SDFRenderer {
  constructor() {
    this.cancelToken = null;
  }

  render(width, height, pattern, params, onProgress) {
    const imageData = new ImageData(width, height);
    const data = imageData.data;

    const totalPixels = width * height;
    const chunkSize = 10000; // Process in chunks for progress

    for (let i = 0; i < totalPixels; i++) {
      // Check cancellation every chunk
      if (i % chunkSize === 0) {
        if (this.cancelToken?.cancelled) {
          throw new Error('Cancelled');
        }
        onProgress(i / totalPixels);
      }

      const x = (i % width) / width;
      const y = Math.floor(i / width) / height;

      const distance = pattern.sdf(x, y, params);
      const value = this.normalizeDistance(distance);

      const idx = i * 4;
      data[idx] = data[idx + 1] = data[idx + 2] = value;
      data[idx + 3] = 255; // Alpha
    }

    return imageData;
  }

  normalizeDistance(distance) {
    // Convert SDF distance to grayscale [0, 255]
    // Inside = black, outside = white, smooth at boundary
    return Math.floor((1 - Math.tanh(distance * 10)) * 127.5 + 127.5);
  }
}
```

**Key Features:**
- Chunked processing for responsiveness
- Regular cancellation checks
- Progress callbacks
- Pure computation (no DOM access in worker)

**Performance Optimizations:**
- Typed arrays for pixel data
- Avoid expensive function calls in inner loop
- Consider transferable objects for ImageData
- Future: OffscreenCanvas when widely supported

---

### 4. Pattern Library
**Responsibility:** Define SDF patterns (space-filling curves, etc.)

**Pattern Interface:**
```javascript
class SDFPattern {
  /**
   * Get pattern name
   */
  get name() {
    throw new Error('Must implement name getter');
  }

  /**
   * Compute signed distance field
   * @param {number} x - Normalized x coordinate [0, 1]
   * @param {number} y - Normalized y coordinate [0, 1]
   * @param {object} params - Pattern parameters
   * @returns {number} Signed distance (negative = inside)
   */
  sdf(x, y, params) {
    throw new Error('Must implement sdf method');
  }

  /**
   * Get default parameters
   */
  getDefaults() {
    return {
      iterations: 5,
      lineWidth: 2.0
    };
  }
}
```

**Hilbert Curve Implementation:**
```javascript
class HilbertPattern extends SDFPattern {
  get name() { return 'hilbert'; }

  sdf(x, y, params) {
    const points = this.generateHilbertPoints(params.iterations);
    return this.distanceToPolyline(x, y, points, params.lineWidth);
  }

  generateHilbertPoints(iterations) {
    // Recursive Hilbert curve generation
    const points = [];
    const n = Math.pow(2, iterations);

    for (let i = 0; i < n * n; i++) {
      const [hx, hy] = this.hilbertIndexToXY(i, iterations);
      points.push([hx / n, hy / n]);
    }

    return points;
  }

  hilbertIndexToXY(index, order) {
    // Standard Hilbert curve algorithm
    let x = 0, y = 0;
    for (let s = 1; s < (1 << order); s *= 2) {
      const rx = 1 & (index / 2);
      const ry = 1 & (index ^ rx);
      [x, y] = this.rotate(s, x, y, rx, ry);
      x += s * rx;
      y += s * ry;
      index /= 4;
    }
    return [x, y];
  }

  rotate(n, x, y, rx, ry) {
    if (ry === 0) {
      if (rx === 1) {
        x = n - 1 - x;
        y = n - 1 - y;
      }
      return [y, x];
    }
    return [x, y];
  }

  distanceToPolyline(x, y, points, lineWidth) {
    let minDist = Infinity;

    for (let i = 0; i < points.length - 1; i++) {
      const [x1, y1] = points[i];
      const [x2, y2] = points[i + 1];
      const dist = this.distanceToSegment(x, y, x1, y1, x2, y2);
      minDist = Math.min(minDist, dist);
    }

    return minDist - (lineWidth / 1000); // Adjust for line width
  }

  distanceToSegment(px, py, x1, y1, x2, y2) {
    const dx = x2 - x1;
    const dy = y2 - y1;
    const t = Math.max(0, Math.min(1,
      ((px - x1) * dx + (py - y1) * dy) / (dx * dx + dy * dy)
    ));
    const closestX = x1 + t * dx;
    const closestY = y1 + t * dy;
    return Math.hypot(px - closestX, py - closestY);
  }
}
```

**Pattern Registry:**
```javascript
const PatternLibrary = {
  patterns: new Map(),

  register(pattern) {
    this.patterns.set(pattern.name, pattern);
  },

  get(name) {
    return this.patterns.get(name);
  },

  list() {
    return Array.from(this.patterns.keys());
  }
};

// Register built-in patterns
PatternLibrary.register(new HilbertPattern());
PatternLibrary.register(new PeanoPattern());
PatternLibrary.register(new ZOrderPattern());
```

---

### 5. Image Processor (Web Worker)
**Responsibility:** Apply halftone patterns to images

**Core Algorithm:**
```javascript
// halftone-worker.js
class HalftoneProcessor {
  applyHalftone(imageData, patternData, method, onProgress) {
    const { width, height } = imageData;
    const result = new ImageData(width, height);

    const totalPixels = width * height;
    const chunkSize = 10000;

    for (let i = 0; i < totalPixels; i++) {
      if (i % chunkSize === 0) {
        if (this.cancelToken?.cancelled) {
          throw new Error('Cancelled');
        }
        onProgress(i / totalPixels);
      }

      const idx = i * 4;

      // Convert to grayscale
      const gray = 0.299 * imageData.data[idx] +
                   0.587 * imageData.data[idx + 1] +
                   0.114 * imageData.data[idx + 2];

      // Get pattern value at this pixel
      const patternValue = patternData.data[idx];

      // Apply halftone method
      let output;
      switch (method) {
        case 'threshold':
          output = gray > patternValue ? 255 : 0;
          break;
        case 'blend':
          output = (gray * patternValue) / 255;
          break;
        case 'dither':
          output = this.dither(gray, patternValue);
          break;
      }

      result.data[idx] = result.data[idx + 1] = result.data[idx + 2] = output;
      result.data[idx + 3] = 255;
    }

    return result;
  }
}
```

---

### 6. Canvas I/O Layer
**Responsibility:** Load and save images using Canvas API

**Implementation:**
```javascript
class CanvasIO {
  static async loadImage(file) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0);
        resolve(ctx.getImageData(0, 0, canvas.width, canvas.height));
      };
      img.onerror = reject;
      img.src = URL.createObjectURL(file);
    });
  }

  static saveImage(canvas, filename, format = 'png', quality = 0.95) {
    canvas.toBlob((blob) => {
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      a.click();
      URL.revokeObjectURL(url);
    }, `image/${format}`, quality);
  }

  static displayImageData(imageData, canvas) {
    canvas.width = imageData.width;
    canvas.height = imageData.height;
    const ctx = canvas.getContext('2d');
    ctx.putImageData(imageData, 0, 0);
  }
}
```

---

## Data Flow Diagrams

### Pattern Generation Flow
```
User Clicks "Generate Pattern"
    │
    ├─→ Validate parameters
    │
    ├─→ Disable UI, show progress bar
    │
    ├─→ Spawn Pattern Worker
    │
    ├─→ Worker: Generate SDF pattern
    │   ├─→ Process in chunks
    │   ├─→ Send progress updates
    │   └─→ Check cancellation token
    │
    ├─→ Main Thread: Update progress bar
    │
    ├─→ Worker: Complete, return ImageData
    │
    ├─→ Main Thread: Display on canvas
    │
    ├─→ Enable download button
    │
    ▼
Pattern Ready
```

### Halftone Application Flow
```
User Uploads Image + Clicks "Apply Halftone"
    │
    ├─→ Load image file to Canvas
    │
    ├─→ Generate pattern matching image size
    │   (or resize existing pattern)
    │
    ├─→ Spawn Halftone Worker
    │
    ├─→ Worker: Apply halftone algorithm
    │   ├─→ Process in chunks
    │   ├─→ Send progress updates
    │   └─→ Check cancellation token
    │
    ├─→ Main Thread: Update progress bar
    │
    ├─→ Worker: Complete, return ImageData
    │
    ├─→ Main Thread: Display result
    │
    ▼
Halftoned Image Ready
```

### Cancellation Flow
```
User Clicks "Cancel" Button
    │
    ├─→ Set cancelToken.cancelled = true
    │
    ├─→ Worker detects cancellation in next chunk
    │
    ├─→ Worker sends 'cancelled' message
    │
    ├─→ Main Thread terminates worker
    │
    ├─→ Reset UI state
    │
    ├─→ Clear progress bar
    │
    ▼
Ready for New Operation
```

---

## Web Worker Communication

### Message Protocol
```javascript
// Main Thread → Worker
{
  type: 'render',
  pattern: 'hilbert',
  params: { iterations: 5, lineWidth: 2.0, size: 1000 },
  cancelToken: { cancelled: false }
}

// Worker → Main Thread (Progress)
{
  type: 'progress',
  progress: 0.75  // 75% complete
}

// Worker → Main Thread (Complete)
{
  type: 'complete',
  imageData: ImageData  // Transferable
}

// Worker → Main Thread (Cancelled)
{
  type: 'cancelled'
}

// Worker → Main Thread (Error)
{
  type: 'error',
  message: 'Error description'
}
```

### Worker Management
- Workers are created per operation
- Workers are terminated after completion/cancellation
- Use transferable objects for ImageData (zero-copy)
- Shared cancellation token pattern

---

## Testing Strategy

### Unit Tests (Vitest/Jest)
- Pattern SDF functions (mathematical correctness)
- Distance calculations
- Coordinate transformations
- Image processing algorithms
- Utility functions

### Integration Tests
- Pattern generation end-to-end
- Halftone application end-to-end
- File upload/download
- Worker communication
- Cancellation behavior

### Manual Browser Testing
- Visual quality assessment
- Cross-browser compatibility (Chrome, Firefox, Safari, Edge)
- Mobile responsiveness
- Performance with large images
- Memory usage monitoring

### Performance Tests
- Pattern generation timing
- Memory consumption
- Progress update responsiveness
- UI responsiveness during operations

---

## Security Considerations

- File uploads validated (image types only)
- File size limits (prevent browser memory exhaustion)
- No eval() or dynamic code execution
- CSP headers for GitHub Pages
- All processing client-side (no server vulnerabilities)

---

## Deployment Architecture

### File Structure
```
halftonish/
├── index.html              # Main page
├── styles.css              # Styles
├── app.js                  # Main application controller
├── patterns/
│   ├── base.js             # SDFPattern base class
│   ├── hilbert.js          # Hilbert curve
│   ├── peano.js            # Peano curve
│   └── zorder.js           # Z-order curve
├── workers/
│   ├── pattern-worker.js   # Pattern generation worker
│   └── halftone-worker.js  # Halftone application worker
├── utils/
│   ├── canvas-io.js        # Canvas I/O utilities
│   └── math.js             # Math utilities
├── assets/
│   └── examples/           # Sample images and patterns
└── README.md
```

### GitHub Pages Configuration
- Enable GitHub Pages in repository settings
- Source: main branch, root directory
- Custom domain optional
- No Jekyll processing needed (add `.nojekyll`)

### Browser Compatibility
- Modern browsers with ES6+ support
- Web Workers (all modern browsers)
- Canvas API (universal)
- File API (universal)
- No transpilation needed (or use Babel if supporting older browsers)

---

## Performance Targets

| Operation | Target | Notes |
|-----------|--------|-------|
| UI responsiveness | Always responsive | Web Workers prevent blocking |
| Progress updates | Every 100ms | Smooth progress bar animation |
| Cancellation response | <500ms | Worker checks frequently |
| Small pattern (500px) | <1s | Instant feedback |
| Large pattern (2000px) | <10s | With progress feedback |
| Page load | <2s | Minimal dependencies |
| Memory usage | <500MB | For typical operations |

---

## Future Enhancements

1. **OffscreenCanvas:** Better worker performance when widely supported
2. **WebAssembly:** Optimize SDF calculations if needed
3. **IndexedDB:** Cache generated patterns
4. **Service Worker:** Offline capability
5. **WebGL:** GPU-accelerated rendering for real-time preview
6. **Multi-threading:** Multiple workers for parallel processing
7. **Streaming:** Process very large images in tiles
