# Split Google Search

A Chrome extension created with create-web-extension.

## Features

- TypeScript based extension
- React for UI components
- Manifest V3
- Webpack for bundling

## Extension Structure

This extension has a dual structure:

1. **Development Structure** (in the `src/` directory):
   - Source files for development
   - Used by webpack to build the extension

2. **Direct Loading Structure** (in the root directory):
   - Basic files for direct loading in Chrome
   - Allows loading the extension without building

You can choose either approach:

### Option 1: Direct Loading (Quick Start)

You can immediately load the extension in Chrome without any build step:

1. Open Chrome and navigate to `chrome://extensions`
2. Enable "Developer mode" in the top right corner
3. Click "Load unpacked" and select **this directory** (the root of the project)
4. The extension should now be installed and visible in your browser

This is useful for quick testing, but doesn't include any advanced features that require building.

### Option 2: Development Workflow (Recommended)

For the full development experience with all features:

## Development

### Prerequisites

- Node.js (v14 or higher)
- npm or yarn

### Quick Start

```bash
# Install dependencies, build the extension, and show loading instructions
npm run setup
```

### Manual Installation

```bash
# Install dependencies
npm install
```

### Build the Extension

```bash
# Create a production build (REQUIRED before loading in Chrome)
npm run build
```

### Development Mode

```bash
# Start development build with watch mode
npm run dev
```

> **IMPORTANT**: You must run `npm run build` at least once before loading the extension in Chrome.
> The `npm run dev` command will watch for changes and rebuild automatically, but you'll need to refresh the extension in Chrome to see the changes.

## Loading the Built Extension in Chrome

1. Open Chrome and navigate to `chrome://extensions`
2. Enable "Developer mode" in the top right corner
3. Click "Load unpacked" and select the `dist` directory from this project
4. The extension should now be installed and visible in your browser

## Troubleshooting

### Counter Not Incrementing

If the counter doesn't increment when clicking the button:

1. **Check Permissions**: Make sure the extension has the "storage" permission in the manifest.json file.
2. **Reload the Extension**: Try removing the extension and loading it again.
3. **Check Console**: Open the extension popup, right-click and select "Inspect" to view the console for any errors.
4. **Reset Storage**: You can reset the extension's storage by going to chrome://extensions, finding your extension, clicking "Details", then "Clear Data".
5. **Verify Background Script**: The background script should initialize the counter on installation. Check if it's running properly.

### Other Issues

If you encounter other issues:

1. **Check Chrome's Extension Errors**: Go to chrome://extensions and look for any error messages under your extension.
2. **Inspect the Popup**: Right-click on the popup and select "Inspect" to access the DevTools for debugging.
3. **Verify Manifest**: Make sure your manifest.json file is correctly formatted and has all required permissions.
4. **Check Build Output**: If using the build process, check that the files in the dist directory are correct.

## Project Structure

```
├── dist/               # Built extension files (created after build)
├── src/                # Source files
│   ├── assets/         # Static assets like icons
│   ├── background/     # Background script
│   ├── content/        # Content scripts
│   ├── options/        # Options page
│   ├── popup/          # Popup UI
│   └── manifest.json   # Extension manifest
├── assets/             # Assets for direct loading
├── scripts/            # Helper scripts
├── manifest.json       # Manifest for direct loading
├── webpack.config.js   # Webpack configuration
├── package.json        # Project dependencies and scripts
├── tsconfig.json      # TypeScript configuration
└── README.md          # This file
```

## License

MIT
