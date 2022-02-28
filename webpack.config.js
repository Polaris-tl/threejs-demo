const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const { CleanWebpackPlugin } = require('clean-webpack-plugin');
const webpack = require('webpack')

const PublicPath = ''

module.exports = {
  mode:'development',
  entry:'./src/index.ts',
  output:{
    path: path.resolve(__dirname,'dist'),
    filename: 'bundle.js',
    publicPath: PublicPath,
  },
  devServer:{ 
    hot: true,
    port: 5555,
    open: true,
    progress: true,
    contentBase:[ path.resolve(__dirname,'public'), path.resolve(__dirname,'dist')],
  },
  module:{
    rules:[
      { test:/\.(ts|js)$/,
        exclude: /node_modules/,
        use: ['ts-loader']
      }
    ]
  },
  resolve: {
    extensions:['.js','.ts']
  },
  plugins:[
    new CleanWebpackPlugin(),
    new webpack.HotModuleReplacementPlugin(),
    new CopyWebpackPlugin({ 
      patterns: [
        { 
          from: path.resolve(__dirname,'public'), 
          to: path.resolve(__dirname,'dist'),
          globOptions: {
            ignore: [
              "**/*.html",
            ],
          },
        }
      ]
    }),
    new HtmlWebpackPlugin({
      template: './public/index.html',
      filename: 'index.html',
      hash: true,
      scriptLoading: 'blocking'
    }),
  ]
}