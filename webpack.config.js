const path = require('path');
const webpack = require('webpack');
module.exports = {
  mode: 'development',
  // 엔트리 포인트의 설정
  entry: path.join(__dirname, 'src/index.js'),
  // 출력 설정
  output: {
    // 출력 파일 이름
    filename: 'bundle.js',
    path: path.join(__dirname, 'public')
  },

    plugins: [
        new webpack.ProvidePlugin({
            'THREE': 'three'
        }),

],
  // babel 설정
  module: {
    rules: [
        {
            test: /\.obj$/,
            loader: 'webpack-obj-loader'
        },
      {
        test: [/\.js$/, /\.jsx$/],
        exclude: /node_modules/,
        use: [
          {
            loader: 'babel-loader',
          }
        ]
      },
        {
            test: /\.css$/,
            use: ['style-loader', 'css-loader']
        },
       {
            test: /\.jpg|png$/,
            loader: "file?name=[path][name].[ext]"
        }
    ]
  }
}