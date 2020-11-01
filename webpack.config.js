const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const { CleanWebpackPlugin } = require('clean-webpack-plugin');

module.exports = {
  mode: 'development',
  entry: './src/index.js',
  plugins: [
    new CleanWebpackPlugin(),
    new HtmlWebpackPlugin({
      title: 'blood lines',
      template: "./src/index.html",
      filename: "./index.html"
    }),
  ],
  output: {
    filename: 'bundle.js',
    path: path.resolve(__dirname, 'dist'),
  },
  devtool: 'inline-source-map',
  devServer: {
    contentBase: './dist',
    host: '0.0.0.0'
  },
  module: {
    rules: [
      {
        test: /\.s[ac]ss$/i,
        use: [
          // Creates `style` nodes from JS strings
          'style-loader',
          // Translates CSS into CommonJS
          'css-loader',
          // Compiles Sass to CSS
          'sass-loader',
        ],
      },
      {
        test: /\.css$/,
        use: [
          'style-loader',
          'css-loader',
        ],
      },
      {
        test: /\.ged$/i,
        use: 'raw-loader',
      },
      {
        test: /\.(png|svg|jpg|gif)$/,
        use: [
          'file-loader',
        ],
      },
      {
        test: /\.(woff|woff2|eot|ttf|otf)$/,
        use: [
          'file-loader',
        ],
      },
      {
        test: /\.csv$/,
        loader: 'csv-loader',
        options: {
          dynamicTyping: true,
          header: true,
          skipEmptyLines: true
        }
      },
      {
        test: /\.js$/,
        exclude: /node_modules/,
        use: {
          loader: "babel-loader"
        }
      },
    ],
  },
};
