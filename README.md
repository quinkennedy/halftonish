# Halftonish

> SDF-based halftone pattern generator running entirely in your browser

Halftonish is a browser-based tool for generating signed distance field (SDF) patterns and applying them as halftone effects to images. It specializes in space-filling curves like Hilbert, Peano, and Z-order curves.

## Features

- **Generate Patterns:** Create grayscale SDF patterns from space-filling curves
- **Apply Halftones:** Upload images and apply pattern-based halftoning
- **Real-time Feedback:** Progress bars and responsive UI
- **Cancellable Operations:** Stop long renders at any time
- **Download Results:** Export patterns and halftoned images
- **Zero Install:** Runs entirely in your browser, no server required

## Live Demo

🚀 **[Try it now](https://yourusername.github.io/halftonish)** (Coming soon)

## Supported Patterns

- Hilbert Curve
- Peano Curve (Coming soon)
- Z-Order/Morton Curve (Coming soon)
- More space-filling curves planned!

## How It Works

Halftonish uses signed distance fields (SDFs) to render smooth, scalable patterns. Space-filling curves are generated mathematically and converted to distance fields, which can then be applied to images as halftone screens.

All processing happens in your browser using:
- **Canvas API** for image manipulation
- **Web Workers** for non-blocking computation
- **Modern JavaScript** (ES6+) with no build step

## Development Status

This project is in active development. See [features.md](features.md) for the roadmap.

**Current Version:** v0.1.0-dev

## Project Documentation

- [claude.md](claude.md) - Project overview and SDLC
- [architecture.md](architecture.md) - Technical architecture
- [features.md](features.md) - Feature list and roadmap

## Local Development

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/halftonish.git
   cd halftonish
   ```

2. Start a local server:
   ```bash
   # Python 3
   python -m http.server 8000

   # Python 2
   python -m SimpleHTTPServer 8000

   # Node.js
   npx serve
   ```

3. Open http://localhost:8000 in your browser

## Browser Compatibility

Halftonish requires a modern browser with support for:
- ES6+ JavaScript
- Web Workers
- Canvas API
- File API

Tested on:
- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## License

MIT License - See [LICENSE](LICENSE) for details

## Contributing

Contributions welcome! Please read the architecture and feature docs first.

## Acknowledgments

Built with vanilla JavaScript and modern web APIs. No frameworks, no build step, just browser-native code.
