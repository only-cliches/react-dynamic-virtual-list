module.exports = {
    entry: './index.js',
    output: {
      filename: 'react-dvl.min.js',
      libraryTarget: 'umd',
      umdNamedDefine: true
    },
    externals: ["react"],
  };