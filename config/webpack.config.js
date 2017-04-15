
var webpack = require('webpack');
var path = require('path');

var config = {

  devtool: 'cheap-module-source-map',
  performance: {
    hints: false
  },
  entry: {
    'ngx-canvas-hold-animation.umd': './src/index.ts',
    'ngx-canvas-hold-animation.umd.min': './src/index.ts'
  },
  output: {
    path: path.join(__dirname, '../bundles'),
    filename: '[name].js',
    library: 'ngx-canvas-hold-animation',
    libraryTarget: 'umd',
    umdNamedDefine: true
  },
  module: {
    rules: [
      {
        test: /\.js$/,
        loaders: [
          'strip-sourcemap-loader'
        ]
      },
      {
        test: /\.ts$/,
        loaders: [
          'awesome-typescript-loader?configFileName=src/tsconfig.json&declaration=false',
          'angular2-template-loader'
        ]
      },
      {
        test: /\.(html|css)$/,
        loader: 'raw-loader'
      }
    ]
  },
  resolve: {
    extensions: ['.js', '.ts'],
    modules: [ '../src', path.join(__dirname, '../node_modules') ]
  },
  plugins: [
    new webpack.optimize.UglifyJsPlugin({
      include: /\.min\.js$/,
      minimize: true
    })
  ],
  externals: [
    '@angular/common',
    '@angular/compiler',
    '@angular/core',
    'rxjs/Rx'
  ]
};

module.exports = config;