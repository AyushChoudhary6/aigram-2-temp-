const dotenv = require('dotenv');

dotenv.config();

const appJson = require('./app.json');

module.exports = () => ({
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
});
