const { getDefaultConfig } = require("expo/metro-config");
// const path = require("path");

const config = getDefaultConfig(__dirname);

// Add all Node.js polyfills using available packages
// config.resolver.extraNodeModules = {
//   ...config.resolver.extraNodeModules,
//   buffer: require.resolve("buffer"),
//   "node:buffer": require.resolve("buffer"),
//   crypto: require.resolve("expo-crypto"),
//   "node:crypto": require.resolve("expo-crypto"),
//   events: require.resolve("events"),
//   "node:events": require.resolve("events"),
//   stream: require.resolve("stream-browserify"),
//   "node:stream": require.resolve("stream-browserify"),
//   util: path.resolve(__dirname, "./polyfills/util.ts"),
//   "node:util": path.resolve(__dirname, "./polyfills/util.ts"),
//   path: require.resolve("path-browserify"),
//   "node:path": require.resolve("path-browserify"),
//   http: path.resolve(__dirname, "./polyfills/http.ts"),
//   "node:http": path.resolve(__dirname, "./polyfills/http.ts"),
//   https: path.resolve(__dirname, "./polyfills/http.ts"),
//   "node:https": path.resolve(__dirname, "./polyfills/http.ts"),
//   url: path.resolve(__dirname, "./polyfills/url.ts"),
//   "node:url": path.resolve(__dirname, "./polyfills/url.ts"),
// };

// Enable Fast Refresh
config.server = {
  ...config.server,
  enhanceMiddleware: (middleware) => {
    return (req, res, next) => {
      // Enable CORS for hot module reloading
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
      return middleware(req, res, next);
    };
  },
};

// Ensure unstable flags are set for package exports
config.resolver.unstable_enablePackageExports = true;

// Handle node: prefix by redirecting to the non-prefixed version
const originalResolveRequest = config.resolver.resolveRequest;
config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (moduleName.startsWith("node:")) {
    // Simply remove the node: prefix and let Metro resolve it normally
    moduleName = moduleName.slice(5);
  }

  // Use original resolver or default
  if (originalResolveRequest) {
    return originalResolveRequest(context, moduleName, platform);
  }

  return context.resolveRequest(context, moduleName, platform);
};

module.exports = config;
