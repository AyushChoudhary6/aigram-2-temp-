const dotenv = require('dotenv');
const fs = require('fs');

dotenv.config();

const appJson = require('./app.json');

module.exports = () => {
  const config = {
    expo: {
      ...appJson.expo,
      plugins: [
        ...(appJson.expo.plugins || []),
        'expo-audio',
      ],
      extra: {
        ...appJson.expo.extra,
        EXPO_PUBLIC_BACKEND_URL: process.env.EXPO_PUBLIC_BACKEND_URL || 'http://localhost:3000',
        API_BASE_URL: process.env.API_BASE_URL || 'http://localhost:3000/api',
        EXPO_PUBLIC_HF_API_KEY: process.env.EXPO_PUBLIC_HF_API_KEY || '',
      },
    },
  };

  // Only add googleServicesFile if it exists
  if (fs.existsSync('./google-services.json')) {
    config.expo.android = {
      ...config.expo.android,
      googleServicesFile: './google-services.json',
    };
  }

  return config;
};
