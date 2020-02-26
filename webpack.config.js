const path = require('path');
const dotEnv = require('dotenv-webpack');
const webpack = require('webpack');
console.log((new Date()).getTime())
module.exports = {
  mode: 'development',
  entry: path.join(__dirname, 'src', 'index'),
  // watch: true,
  target: 'node',
  output: {
    path: path.join(__dirname, 'dist'),
    publicPath: '/dist/',
    filename: "bundle.js",
    chunkFilename: '[name].js'
  },
  module: {
    rules: [{
      test: /.tsx?$/,
      include: [
        path.resolve(__dirname, 'src')
      ],
      exclude: [
        path.resolve(__dirname, 'node_modules')
      ],
      loader: 'ts-loader',
    }]
  },
  resolve: {
    extensions: ['.json', '.tsx', '.ts', '.js', '.jsx']
  },
  plugins: [
    new webpack.EnvironmentPlugin({
      __BUILD_TIME__: (new Date()).getTime()
    }),
    new dotEnv({
      safe: true,
    }),
  ],
  devtool: 'inline-source-map',
  devServer: {
    contentBase: path.join(__dirname, '/dist/'),
    inline: true,
    host: 'localhost',
    port: 8080,
  }
};