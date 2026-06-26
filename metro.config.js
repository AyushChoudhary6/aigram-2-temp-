const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Ensure Firebase v10 package exports resolve correctly on React Native/Hermes
config.resolver.sourceExts = [...(config.resolver.sourceExts || []), 'cjs'];
config.resolver.unstable_enablePackageExports = true;
config.resolver.unstable_conditionNames = ['require', 'react-native', 'import'];

// Configure Metro to be accessible from other devices on the network
config.server = {
  enhanceMiddleware: (middleware) => {
    return (req, res, next) => {
      // Allow requests from any origin
      res.setHeader('Access-Control-Allow-Origin', '*');
      return middleware(req, res, next);
    };
  },
};

module.exports = config;
