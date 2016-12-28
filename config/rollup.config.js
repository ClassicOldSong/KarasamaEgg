// Rollup plugins
const babel = require('rollup-plugin-babel')
const eslint = require('rollup-plugin-eslint')
const resolve = require('rollup-plugin-node-resolve')
const commonjs = require('rollup-plugin-commonjs')
const replace = require('rollup-plugin-replace')
const uglify = require('rollup-plugin-uglify')
const progress = require('rollup-plugin-progress')
const image = require('rollup-plugin-image')
const postcss = require('rollup-plugin-postcss')
const html = require('rollup-plugin-html')
const git = require('git-rev-sync')
const { name, version } = require('../package.json')

module.exports = {
	entry: 'src/main.js',
	devDest: 'test/main.dev.js',
	proDest: 'dist/main.min.js',
	format: 'iife',
	sourceMap: 'inline',
	plugins: [
		progress({
			clearLine: false
		}),
		resolve({
			jsnext: true,
			main: true,
			browser: true,
		}),
		commonjs(),
		html({
			include: 'src/*.html'
		}),
		postcss(),
		image(),
		eslint({
			exclude: ['**/*.html', '**/*.svg', '**/*.css']
		}),
		babel({
			exclude: 'node_modules/**',
			runtimeHelpers: true
		}),
		replace({
			ENV: JSON.stringify(process.env.NODE_ENV || 'development'),
			APPNAME: JSON.stringify(name),
			VERSION: JSON.stringify(`${version}.${git.branch()}.${git.short()}`)
		}),
		(process.env.NODE_ENV === 'production' && uglify())
	]
}
