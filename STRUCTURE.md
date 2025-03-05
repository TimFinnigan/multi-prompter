# Important Note

This extension has a dual structure:

1. **Development Structure** (in the `src/` directory):
   - Source files for development
   - Used by webpack to build the extension

2. **Direct Loading Structure** (in the root directory):
   - Basic files for direct loading in Chrome
   - Allows loading the extension without building

For the best development experience, we recommend:
1. Install dependencies: `npm install`
2. Build the extension: `npm run build`
3. Load the `dist/` directory in Chrome

However, you can also directly load the extension from the root directory for quick testing.
