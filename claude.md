# Halftonish - SDF-Based Halftone Pattern Generator

## Project Overview

Halftonish is a browser-based signed distance field (SDF) renderer for creating halftone patterns. It runs entirely in the browser with no server required, generating grayscale pattern images that can be used for halftoning and applies SDF-based halftoning to input images.

## Purpose

Create a flexible web application for:
- Generating SDF-based halftone patterns (initially space-filling curves)
- Exporting grayscale pattern images for external use
- Importing images and applying SDF halftoning directly in the browser
- Providing real-time progress feedback and cancellation during rendering
- Hosted on GitHub Pages for zero-cost, instant access

## Software Development Life Cycle (SDLC)

This project follows a feature-driven development cycle. Each feature moves through the following states:

**TODO → ACTIVE → DONE**

### Feature Development Process

For each feature (see features.md for the complete list):

#### 1. Move Feature to ACTIVE

- Select a feature from the TODO list in features.md
- Move it from the "Must Have" or "Should Have" section to an ACTIVE section
- Update the feature status to indicate work has begun
- Commit this change with message: `Start: [Feature Name]`

#### 2. Create Detailed Planning Document

- Create a planning document: `docs/planning/[feature-id]-[feature-name].md`
- Include:
  - **Detailed Requirements:** Specific implementation requirements
  - **Technical Design:** Architecture, data structures, algorithms
  - **Task Breakdown:** Step-by-step implementation tasks
  - **Dependencies:** Other features or components needed
  - **Testing Plan:** How to verify the feature works
  - **Acceptance Criteria:** Clear definition of "done"
- Commit planning doc with message: `Plan: [Feature Name]`

#### 3. Implement Feature

- Write code following the plan
- Make incremental commits with clear messages
- Follow coding standards defined below
- Keep implementation focused on the single feature
- Update relevant files (HTML, CSS, JS, workers, etc.)
- Each commit message format: `Implement: [Feature Name] - [specific change]`

#### 4. Test Feature

- Manually test in browser
- Test all user stories from features.md
- Test edge cases and error conditions
- Cross-browser testing (Chrome, Firefox, Safari, Edge)
- Mobile responsive testing
- Document any bugs found and fix them
- Commit fixes with message: `Fix: [Feature Name] - [bug description]`

#### 5. Document Feature

- Update README.md if user-facing
- Add JSDoc comments to new functions/classes
- Update architecture.md if architecture changed
- Create usage examples if applicable
- Update features.md to reflect completion
- Commit docs with message: `Docs: [Feature Name]`

#### 6. Move Feature to DONE

- In features.md, move feature from ACTIVE to DONE section
- Add completion date
- Note any deviations from original plan
- Commit with message: `Complete: [Feature Name]`

#### 7. Ensure All Changes Committed

- Run `git status` to verify working directory is clean
- Push all commits to main branch
- Verify GitHub Pages deployment if applicable

---

### Development Workflow Example

```bash
# 1. Start feature
# Edit features.md - move F2 from TODO to ACTIVE
git add features.md
git commit -m "Start: F2 Hilbert Curve Pattern"

# 2. Create planning doc
# Create docs/planning/F2-hilbert-curve.md
git add docs/planning/F2-hilbert-curve.md
git commit -m "Plan: F2 Hilbert Curve Pattern"

# 3. Implement
# Edit patterns/hilbert.js
git add patterns/hilbert.js
git commit -m "Implement: F2 Hilbert Curve - SDF algorithm"

# Edit app.js to integrate
git add app.js
git commit -m "Implement: F2 Hilbert Curve - integrate with UI"

# 4. Test and fix
# Test in browser, find bug, fix it
git add patterns/hilbert.js
git commit -m "Fix: F2 Hilbert Curve - boundary condition error"

# 5. Document
# Add JSDoc comments, update README
git add patterns/hilbert.js README.md
git commit -m "Docs: F2 Hilbert Curve Pattern"

# 6. Mark complete
# Edit features.md - move F2 from ACTIVE to DONE
git add features.md
git commit -m "Complete: F2 Hilbert Curve Pattern"

# 7. Push all
git push origin main
```

---

### File Organization

**Planning Documents:**
```
docs/
└── planning/
    ├── F1-generate-patterns.md
    ├── F2-hilbert-curve.md
    ├── F3-apply-halftone.md
    └── ...
```

**Source Code:**
```
index.html         # Main HTML
styles.css         # Styles
app.js             # Main controller
patterns/          # Pattern implementations
  ├── base.js
  ├── hilbert.js
  └── ...
workers/           # Web Workers
  ├── pattern-worker.js
  └── halftone-worker.js
utils/             # Utilities
  └── canvas-io.js
```

---

### Git Branch Strategy

- **All work happens on `main` branch**
- No feature branches
- Commit early and often
- Each commit should be atomic and focused
- Push regularly to keep remote updated

---

### Commit Message Format

```
[Category]: [Feature Name] - [description]
```

**Categories:**
- `Start` - Beginning work on a feature
- `Plan` - Adding planning documentation
- `Implement` - Implementation work
- `Fix` - Bug fixes
- `Docs` - Documentation updates
- `Complete` - Feature completion
- `Refactor` - Code refactoring
- `Test` - Test-related changes

**Examples:**
```
Start: F6 Progress Feedback
Plan: F6 Progress Feedback
Implement: F6 Progress Feedback - add progress bar component
Implement: F6 Progress Feedback - integrate with workers
Fix: F6 Progress Feedback - progress bar not updating
Docs: F6 Progress Feedback
Complete: F6 Progress Feedback
```

---

## Development Principles

### Code Quality
- Follow JavaScript best practices (ES6+ modules)
- Maintain test coverage for core algorithms
- All code must pass ESLint
- Peer review required for all changes

### Performance
- Non-blocking rendering with Web Workers
- Progress feedback during long operations
- Interruptible/cancellable rendering
- Memory efficient for large images
- Optimize SDF calculations for browser speed

### Extensibility
- Modular pattern library
- Clear interfaces for extending functionality
- URL parameter configuration support

### User Experience
- Clear error messages
- Real-time progress indicators
- Cancel buttons for long operations
- Sensible defaults
- Responsive design for mobile and desktop
- Immediate visual feedback

## Technology Stack

**Frontend:** Vanilla JavaScript (ES6+)
- No build step required for simplicity
- Direct GitHub Pages deployment
- Modern browser APIs (Canvas, File, Web Workers)
- Async/await for cancellable operations

**Core Technologies:**
- **HTML5 Canvas:** Image rendering and manipulation
- **Canvas API:** Pixel-level image processing
- **File API:** Image import from user's device
- **Web Workers:** Non-blocking computation for large renders
- **CSS Grid/Flexbox:** Responsive layout

**Optional Enhancements:**
- **OffscreenCanvas:** Better performance for workers (when browser support improves)
- **WebAssembly:** Potential future optimization for SDF calculations

**Testing:**
- **Vitest** or **Jest:** Unit testing for algorithms
- Manual browser testing across platforms

**Hosting:**
- **GitHub Pages:** Free, instant deployment
- No server required - fully static site

## Success Metrics

- Responsive UI updates during rendering (progress feedback)
- User can cancel any operation at any time
- Support at least 5 different space-filling curve patterns
- Works in all modern browsers (Chrome, Firefox, Safari, Edge)
- Mobile-friendly interface
- Zero critical bugs in production
- User satisfaction (community feedback)
- Page loads in <2 seconds on average connection

## Risk Management

| Risk | Impact | Mitigation |
|------|--------|------------|
| Browser performance with large images | High | Web Workers, chunked rendering, progress feedback |
| Browser compatibility issues | Medium | Test on all major browsers, use polyfills if needed |
| Memory limits in browser | Medium | Tile-based processing, clear memory between operations |
| SDF calculation complexity | Medium | Start with simple patterns, iterate |
| Scope creep | Medium | Strict prioritization, MVP first |

## Version History

- v0.1.0 (Planned): Initial planning and design phase
