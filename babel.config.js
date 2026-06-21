module.exports = function (api) {
  api.cache(true);
  return {
    // babel-preset-expo (SDK 56) automatically includes the react-native-worklets plugin
    // (required by Reanimated 4 for worklets / gesture handlers / layout animations).
    presets: ['babel-preset-expo'],
  };
};
