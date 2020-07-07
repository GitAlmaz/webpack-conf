const path = require('path')
const HTMLWebpackPlugin = require('html-webpack-plugin')
const { CleanWebpackPlugin } = require('clean-webpack-plugin')
const MiniCssExtractPlugin = require('mini-css-extract-plugin')
const CopyWebpackPlugin = require('copy-webpack-plugin')
const fs = require('fs')

const isDev = process.env.NODE_ENV === 'development'

const PATHS = {
	src: path.join(__dirname, './src'),
	dist: path.join(__dirname, './dist'),
	assets: 'assets/'
}
const PAGES_DIR = `${PATHS.src}/pug/pages`
const PAGES = fs.readdirSync(PAGES_DIR).filter(fileName => fileName.endsWith('.pug'))

const filename = (path, ext) => (isDev ? `${PATHS.assets + path}/[name].${ext}` : `${PATHS.assets + path}/[name].[hash].${ext}`)

const jsLoaders = () => {
	const loaders = [
		{
			loader: 'babel-loader',
			options: {
				presets: ['@babel/preset-env']
			}
		}
	]
	isDev && loaders.push('eslint-loader')
	return loaders
}

const plugins = () => {
	const basic = [
		new MiniCssExtractPlugin({
			filename: filename('css', 'css')
		}),
		new CopyWebpackPlugin({
			patterns: [
				{
					from: `${PATHS.src}/${PATHS.assets}images`,
					to: `${PATHS.assets}images`
				},
				{
					from: `${PATHS.src}/${PATHS.assets}fonts`,
					to: `${PATHS.assets}fonts`
				}
			]
		}),
		...PAGES.map(
			page =>
				new HTMLWebpackPlugin({
					template: `${PAGES_DIR}/${page}`,
					filename: `./${page.replace(/\.pug/, '.html')}`,
					minify: {
						collapseWhitespace: !isDev
					}
				})
		)
	]
	if (!isDev) {
		basic.push(new CleanWebpackPlugin())
	}
	return basic
}

module.exports = {
	externals: {
		path: PATHS
	},
	context: PATHS.src,
	mode: 'development',
	entry: {
		main: ['@babel/polyfill', PATHS.src]
	},
	output: {
		filename: filename('js', 'js'),
		path: PATHS.dist,
		publicPath: '/'
	},
	resolve: {
		extensions: ['.js', '.json'],
		alias: {
			'@': PATHS.src
		}
	},
	optimization: {
		splitChunks: {
			chunks: 'all'
		}
	},
	devServer: {
		port: 8081,
		hot: isDev,
		overlay: {
			warning: true,
			errors: true
		}
	},
	devtool: isDev ? 'cheap-module-eval-source-map' : '',
	plugins: plugins(),
	module: {
		rules: [
			{
				test: /\.pug$/,
				loader: 'pug-loader'
			},
			{
				test: /\.s[ac]ss$/,
				use: [
					{
						loader: MiniCssExtractPlugin.loader,
						options: {
							hmr: isDev,
							reloadAll: true
						}
					},
					'css-loader',
					'sass-loader'
				]
			},
			{
				test: /\.(png|jpg|gif|svg)$/,
				loader: 'file-loader',
				options: {
					name: '[name].[ext]'
				}
			},
			{
				test: /\.(woff(2)?|eot|ttf|svg)(\?v=\d+\.\d+\.\d+)?$/,
				loader: 'file-loader',
				options: {
					name: '[name].[ext]'
				}
			},
			{
				test: /\.js$/,
				exclude: /node_modules/,
				use: jsLoaders()
			}
		]
	}
}
