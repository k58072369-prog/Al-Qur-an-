const { getDefaultConfig } = require("expo/metro-config");
const { withNativeWind } = require("nativewind/metro");

const config = getDefaultConfig(__dirname);
config.resolver.sourceExts.push("mjs");

// Exclude Replit-internal folders from Metro's file watcher and resolver.
// These directories can contain transient files that crash the watcher.
const existing = config.resolver.blockList;
const excludePatterns = [
  /.*\/\.local\/.*/,
  /.*\/\.agents\/.*/,
  /.*\/\.cache\/.*/,
  /.*\/\.vscode\/.*/,
];
config.resolver.blockList = existing
  ? [].concat(existing, excludePatterns)
  : excludePatterns;

module.exports = withNativeWind(config, { input: "./global.css" });
