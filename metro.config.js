const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const config = getDefaultConfig(__dirname);

// Add resolver to handle platform-specific extensions and path aliases
config.resolver = {
  ...config.resolver,
  resolverMainFields: ['react-native', 'browser', 'main'],
  sourceExts: [...config.resolver.sourceExts, 'web.tsx', 'web.ts', 'web.jsx', 'web.js'],
  alias: {
    '@': path.resolve(__dirname),
  },
};

module.exports = config;
