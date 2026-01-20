const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Add resolver to handle platform-specific extensions
config.resolver = {
  ...config.resolver,
  resolverMainFields: ['react-native', 'browser', 'main'],
  sourceExts: [...config.resolver.sourceExts, 'web.tsx', 'web.ts', 'web.jsx', 'web.js'],
};

module.exports = config;
