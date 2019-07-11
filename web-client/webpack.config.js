const path = require('path')
const HtmlWebpackPlugin = require('html-webpack-plugin')
const HtmlWebpackRootPlugin = require('html-webpack-root-plugin')
const webpack = require('webpack')
module.exports = {
  mode: 'production',
  entry: {
    regeneratorRuntime: 'regenerator-runtime/runtime', // fixes regenerator runtime error
    app: './src/main'
  },
  output: {
    path: path.resolve(__dirname, 'public'),
    filename: '[name].js'
  },
  devServer: {
    contentBase: path.join(__dirname, 'public'),
    compress: true,
    port: 8080,
    historyApiFallback: true // needed for react router
  },
  module: {
    rules: [
      {
        test: /\.m?js$/,
        exclude: /(node_modules|bower_components)/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: ['@babel/preset-env', '@babel/preset-react']
          }
        }
      },
      {
        test: /\.css$/,
        use: [
          {
            loader: 'style-loader'
          },
          {
            loader: 'css-loader'
          }
        ]
      }
    ]
  },
  plugins: [
    new HtmlWebpackPlugin({
      title: 'dnqr',
      inject: 'body',
      meta: {
        viewport: 'width=device-width, initial-scale=1, shrink-to-fit=no',
        description: 'A chat app.',
        author: 'Nabeel Rana'
      }
    }),
    new HtmlWebpackRootPlugin(),
    new webpack.ProvidePlugin({
      $: 'jquery'
    })
  ]
}

// use below if you need to include 'async/defer' to a library
//
// const HtmlWebpackExternalsPlugin = require('html-webpack-externals-plugin')
// const ScriptExtHtmlWebpackPlugin = require('script-ext-html-webpack-plugin')
//
//     new HtmlWebpackExternalsPlugin({
//       externals: [
//         {
//           module: 'linkedin',
//           entry: {
//             path: 'https://platform.linkedin.com/badges/js/profile.js',
//             type: 'js'
//           }
//         }
//       ]
//     }),
//     new ScriptExtHtmlWebpackPlugin({
//       custom: {
//         test: 'https://platform.linkedin.com/badges/js/profile.js',
//         attribute: 'async defer'
//       }
//     }),
