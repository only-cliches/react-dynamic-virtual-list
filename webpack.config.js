const UglifyJSPlugin = require('uglifyjs-webpack-plugin');

module.exports = {
  entry: './index.js',
  output: {
    filename: 'react-dvl.min.js',
    libraryTarget: 'umd',
    umdNamedDefine: true
  },
  externals: ["React"],
  plugins: [
    new UglifyJSPlugin({
      uglifyOptions: {
        mangle: {
          properties: { regex: new RegExp(/^_/) }
        }
      }
    })
  ],
};