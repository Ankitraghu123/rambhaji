module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      [
        'module-resolver',
        {
          root: ['./'],
          alias: {
            '@components': './src/components',
            '@core':       './src/core',
            '@features':   './src/features',
            '@store':      './src/store',
            '@config':     './src/config',
            '@assets':     './assets',
          },
        },
      ],
      'react-native-reanimated/plugin',
    ],
  };
};
