# Asset.to.Design 🚀

A powerful Figma plugin that bulk imports images and automatically maps them to named layers using intelligent matching algorithms, progress tracking, and an improved user experience.

## ✨ Features

### 🎯 **Intelligent Image Mapping**
- **Name-based matching**: Automatically maps images to layers with matching names
- **Smart layer detection**: Identifies all layers that can hold image fills
- **Bulk processing**: Import multiple images at once for efficient workflows
- **Format support**: Handles PNG, JPG, JPEG, and SVG files
- **Progress tracking**: Real-time progress bars for large import operations
- **Error handling**: Detailed feedback on skipped images and reasons

### 🎨 **Enhanced User Interface**
- **Modern design**: Clean, professional interface with smooth animations
- **Drag & drop**: Intuitive file selection with visual feedback
- **Visual feedback**: Loading states, success indicators, and error messages
- **Statistics display**: Shows total, mapped, and skipped image counts
- **Tooltips**: Helpful hints for each button and feature
- **Responsive layout**: Optimized for different screen sizes

### ⚡ **Performance Improvements**
- **Progress reporting**: Real-time updates during image processing
- **Efficient algorithms**: Optimized layer traversal and matching
- **Memory management**: Better handling of large images and complex frames
- **Error recovery**: Graceful handling of unsupported layers and file types

### 🔧 **Technical Enhancements**
- **TypeScript**: Full type safety and better development experience
- **Modular architecture**: Clean, maintainable code structure
- **Comprehensive logging**: Detailed console output for debugging
- **Error handling**: Robust error handling with user-friendly messages

## 🚀 Getting Started

### Installation
1. Clone this repository
2. Install dependencies: `npm install`
3. Build the plugin: `npm run build`
4. Load the plugin in Figma

### Usage
1. **Select Frame**: Choose a target frame containing named layers
2. **Drop Images**: Drag and drop image files or click to browse
3. **Import**: Click "Import Images to Layers" to apply images automatically

## 🏗️ Architecture

### Image Mapping Process
1. **Frame Selection** - User selects target frame
2. **Layer Indexing** - Plugin scans for named layers that support image fills
3. **Image Processing** - Files are processed and prepared for import
4. **Name Matching** - Images are matched to layers by filename (without extension)
5. **Fill Application** - Images are applied as fills to matching layers
6. **Progress Reporting** - Real-time updates during the process

### Supported Layer Types
- **Rectangle** - Primary target for image fills
- **Frame** - Can hold image fills
- **Ellipse** - Circular image containers
- **Polygon** - Multi-sided shapes
- **Star** - Star-shaped containers
- **Vector** - Vector shapes
- **Component** - Reusable components
- **Instance** - Component instances

### Data Flow
```
Frame Selection → Layer Indexing → Image Processing → Name Matching → Fill Application → Progress Reporting
```

## 📊 Performance Metrics

The plugin tracks and displays:
- **Total**: Number of images selected for import
- **Mapped**: Number of images successfully applied to layers
- **Skipped**: Number of images that couldn't be processed
- **Progress**: Real-time progress during import operations

## 🛠️ Development

### Scripts
- `npm run build` - Build the TypeScript code
- `npm run watch` - Watch mode for development
- `npm run dev` - Build and prepare for Figma
- `npm run clean` - Clean build artifacts

### Project Structure
```
asset-to-design/
├── code.ts          # Main plugin logic
├── ui.html          # User interface
├── manifest.json    # Plugin manifest
├── package.json     # Dependencies and metadata
├── tsconfig.json    # TypeScript configuration
└── README.md        # This file
```

## 🔄 Version History

### v1.0.0 (Current)
- ✨ Image import to named layers
- 🎨 Modern drag & drop interface
- 📊 Progress tracking and statistics
- 🚀 Intelligent layer matching
- 🛠️ TypeScript implementation

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit your changes: `git commit -m 'Add amazing feature'`
4. Push to the branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Figma Plugin API team for the excellent platform
- Community contributors for feedback and suggestions
- Design system practitioners who inspired this tool

## 📞 Support

- **Issues**: [GitHub Issues](https://github.com/Andrelimadesign/move.text/issues)
- **Discussions**: [GitHub Discussions](https://github.com/Andrelimadesign/move.text/discussions)
- **Wiki**: [GitHub Wiki](https://github.com/Andrelimadesign/move.text/wiki)

---

**Made with ❤️ for the Figma design community**
