const path = require("path");
const { getSentryExpoConfig } = require("@sentry/react-native/metro");

const config = getSentryExpoConfig(__dirname);

// Add resolver to handle platform-specific extensions and path aliases
config.resolver = {
  ...config.resolver,
  resolverMainFields: ["react-native", "browser", "main"],
  sourceExts: [
    ...config.resolver.sourceExts,
    "web.tsx",
    "web.ts",
    "web.jsx",
    "web.js",
  ],
  alias: {
    "@": path.resolve(__dirname),
  },
};

// Export config
module.exports = config;
