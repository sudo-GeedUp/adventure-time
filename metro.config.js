const { getDefaultConfig } = require("expo/metro-config");
const { mergeConfig } = require("@react-native/metro-config");

const defaultConfig = getDefaultConfig(__dirname);

const config = mergeConfig(defaultConfig, {
  resolver: {
    blockList: [/node_modules\/react-native-maps\/.*/],
    platforms: ["ios", "android", "native", "web"],
  },
});

module.exports = config;
