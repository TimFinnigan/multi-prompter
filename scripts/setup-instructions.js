// Setup instructions script
const path = require('path');

// ANSI color codes for terminal output
const colors = {
  blue: '\x1b[34m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  reset: '\x1b[0m',
  bold: '\x1b[1m'
};

// Get the absolute path to the dist directory
const distPath = path.resolve(__dirname, '..', 'dist');

console.log('\n' + colors.green + colors.bold + '✅ Extension built successfully!' + colors.reset);
console.log('\n' + colors.blue + colors.bold + 'To load the extension in Chrome:' + colors.reset);
console.log(colors.blue + '1. Open Chrome and navigate to ' + colors.bold + 'chrome://extensions' + colors.reset);
console.log(colors.blue + '2. Enable ' + colors.bold + 'Developer mode' + colors.blue + ' in the top right corner' + colors.reset);
console.log(colors.blue + '3. Click ' + colors.bold + 'Load unpacked' + colors.reset);
console.log(colors.blue + '4. Select the ' + colors.bold + 'dist' + colors.blue + ' directory from this project:' + colors.reset);
console.log(colors.yellow + colors.bold + '   ' + distPath + colors.reset);
console.log('\n' + colors.yellow + colors.bold + 'IMPORTANT:' + colors.yellow + ' Always select the dist directory, NOT the src directory!' + colors.reset);
console.log(colors.yellow + 'The extension must be built before it can be loaded in Chrome.' + colors.reset);
console.log('\n' + colors.blue + 'For development:' + colors.reset);
console.log(colors.blue + '- Run ' + colors.bold + 'npm run dev' + colors.blue + ' to start the development server with auto-reload' + colors.reset);
console.log(colors.blue + '- After making changes, refresh the extension in Chrome to see the updates' + colors.reset);
console.log('\n' + colors.green + 'Happy coding! 🚀' + colors.reset + '\n');
