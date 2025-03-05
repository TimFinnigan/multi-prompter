const path = require('path');
const CopyPlugin = require('copy-webpack-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');

// This webpack configuration builds the extension into the dist/ directory.
// You MUST run 'npm run build' or 'npm run dev' before loading the extension in Chrome.
// When loading the extension in Chrome, select the dist/ directory, NOT the src/ directory.

module.exports = {
  entry: {
    popup: path.join(__dirname, 'src', 'popup', 'index.tsx'),
    options: path.join(__dirname, 'src', 'options', 'index.tsx'),
    background: path.join(__dirname, 'src', 'background', 'index.ts'),
    content: path.join(__dirname, 'src', 'content', 'index.ts'),
  },
  output: {
    path: path.join(__dirname, 'dist'),
    filename: '[name].js',
  },
  module: {
    rules: [
      {
        test: /\.css$/,
        use: ['style-loader', 'css-loader'],
      },
      {
        test: /\.(js|jsx|ts|tsx)$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: [
              '@babel/preset-env',
              '@babel/preset-react',
              '@babel/preset-typescript',
            ],
          },
        },
      },
      {
        test: /\.tsx?$/,
        use: 'ts-loader',
        exclude: /node_modules/,
      },
    ],
  },
  plugins: [
    new CopyPlugin({
      patterns: [
        { from: 'src/manifest.json', to: 'manifest.json' },
        { from: 'src/assets', to: 'assets' },
      ],
    }),
    new HtmlWebpackPlugin({
      template: path.join(__dirname, 'src', 'popup', 'index.html'),
      filename: 'popup.html',
      chunks: ['popup'],
    }),
    new HtmlWebpackPlugin({
      template: path.join(__dirname, 'src', 'options', 'index.html'),
      filename: 'options.html',
      chunks: ['options'],
    }),
  ],
  resolve: {
    extensions: ['.js', '.jsx', '.ts', '.tsx'],
  },
};