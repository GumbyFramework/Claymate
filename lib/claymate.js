
function Claymate() {

	"use strict";

	var fs = require("fs"),
		path = require("path"),
		util = require('util'),
		workingDir = process.cwd();

	/**
	 * Simple error handler for fs.write
	 * @param  {error} error
	 * @return {void} Throws an error.
	 */
	function writeErrorHandler(error) {

		if (error) {
			throw error;
		}

	}

	/**
	 * Ensures gumby directories are present in the provided path
	 * @param  {String} rootPath What path to check.
	 * @return {void} Throws an error.
	 */
	function checkGumbyDirs(rootPath) {

		// If the ui dir doesnt exist, the rest don't since
		// the rest are all parents of that dir.
		if (!fs.existsSync(path.join(rootPath, 'js/libs/ui'))) {
			throw new Error('Path ' + rootPath + ' does not exist or does not contain gumby.');
		}

	}

	/**
	 * Retrieves configuration in gumby.json
	 * @return {Object} The configuration object.
	 */
	this.getJSONConfig = function() {

		var configPath = path.join(workingDir, 'gumby.json'),
			config = {};

		if (fs.existsSync(configPath)) {
			config = JSON.parse(fs.readFileSync(configPath, {
				encoding: 'utf8'
			}));
		}

		return config;
	};

	/**
	 * This method will build the gumby js assets.
	 * @param {Array} modules An array of the modules that will be included, defaults to all.
	 * @param {Array} extraModules An array of any external modules that will be included.
	 * @param {String} gumbyPath The path to gumby that will be used, defaults to current dir + /components/gumby
	 * @param {String} outPath What path to write minified/sourcemap files to.
	 * @param {Boolean} includeSourceMap Whether to write a source map. Defaults to true
	 * @return {void} Writes minified file and its sourcemap.
	 */
	this.build = function(modules, extraModules, gumbyPath, outPath, includeSourceMap) {

		var UglifyJS = require('uglify-js'),
			files = [],
			minified, tmp, tmp2;

		// Force boolean
		if (typeof includeSourceMap !== 'undefined') {
			includeSourceMap = !!includeSourceMap;
		} else {
			includeSourceMap = true;
		}

		// Check for a passed directory
		if (typeof gumbyPath !== 'string') {

			gumbyPath = '';

		}

		// Double check that we can acess gumby files
		checkGumbyDirs(gumbyPath);

		// Check for passed modules, fall back
		// to all modules in ui directory
		if (!util.isArray(modules)) {

			modules = fs.readdirSync(path.join(gumbyPath, 'js/libs/ui'));

		}

		// Check for path to write output to
		// Fall back to current directory.
		if (typeof outPath === 'string') {

			if (!fs.existsSync(outPath)) {
				outPath = workingDir;
			}

		} else {

			outPath = workingDir;

		}

		// Master gumby script
		files.push(path.join(gumbyPath, 'js/libs/gumby.js'));

		// Modules, configurable which shouldbe added.
		for (var i = 0; i < modules.length; i++) {

			tmp = path.basename(modules[i], '.js');

			tmp2 = path.join(
				gumbyPath,
				'js/libs/ui/',
				// Look if there is a gumby. or jquery. in front of the module
				// name, if not, assume gumby. should be prepended.
				(tmp.indexOf('.') !== -1) ? tmp + '.js' : 'gumby.' + tmp + '.js'
			);

			if (fs.existsSync(tmp2)) {
				files.push(tmp2);
			}

		}

		// External modules, which will be passed as paths
		if (util.isArray(extraModules)) {

			for (var j = 0; j < extraModules.length; j++) {

				if (fs.existsSync(extraModules[j])) {
					files.push(extraModules[j]);
				}

			}

		}

		// Final init script
		files.push(path.join(gumbyPath, 'js/libs/gumby.init.js'));

		var minOpts = {};

		if (includeSourceMap) {
			minOpts.outSourceMap = 'gumby.js.map';
		}

		minified = UglifyJS.minify(files, minOpts);

		if (includeSourceMap) {
			// Minified.code apparently doesn't already contain this comment
			// pointing to the sourcemap file. Let's append it if theyre on.
			minified.code += '\n//# sourceMappingURL=' + minOpts.outSourceMap;
		}

		// Need to print minified.code, minified.map to js/libs/gumby.min.js js/libs/gumby.js.map
		// Write the minified and sourcemap files.
		fs.writeFile(path.join(outPath, 'gumby.min.js'), minified.code, writeErrorHandler);

		if (includeSourceMap) {
			fs.writeFile(path.join(outPath, 'gumby.js.map'), minified.map, writeErrorHandler);
		}

	};

}

// Export module.
module.exports = new Claymate();
