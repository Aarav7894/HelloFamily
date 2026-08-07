const { withNativeWind } = require("nativewind/metro");
const { getDefaultConfig } = require("expo/metro-config");
const config = getDefaultConfig(__dirname);

module.exports = withNativeWind(config, {
  input: "./global.css",
  configPath: "./tailwind.config.ts",
  inlineRem: 16,
});
