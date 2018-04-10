const path = require('path');
const webpack = require("webpack");
const PATHS = {
    app: path.join(__dirname, 'src'),
    build: path.join(__dirname, 'examples')
};
const nodeExternals = require('webpack-node-externals');
const UglifyJSPlugin = require('uglifyjs-webpack-plugin');

const options = {
    entry: {
        'react-dvl': [path.join(__dirname, 'source.tsx')]
    },
    output: {
        path: "/bin",
        filename: '[name].min.js',
        libraryTarget: 'umd',
        umdNamedDefine: true
    },
    devServer: {
        historyApiFallback: true,
        inline: false,
    },
    watchOptions: {
        aggregateTimeout: 500,
    },
    resolve: {
        extensions: ['.ts', '.tsx', '.js']
    },
    plugins: [

    ],
    module: {
        rules: [{
                test: /\.ts$/,
                loader: 'ts-loader'
            }
        ]
    }
};

module.exports = options;