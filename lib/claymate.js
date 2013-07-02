
function Claymate() {

	"use strict";

	var fs = require("fs"),
		path = require("path"),
		util = require('util'),
		workingDir = process.cwd(),
		gumbyPathDefault = path.join(workingDir, '/components/gumby/');

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
	 * @param {String} gumbyPath The path to gumby that will be used, defaults to current dir + /components/gumby
	 * @return {void} Writes minified file and its sourcemap.
	 */
	this.build = function(modules, gumbyPath, outPath) {

		var UglifyJS = require('uglify-js'),
			files = [],
			minified, tmp, tmp2;

		// Check for a passed directory
		if (typeof gumbyPath === 'string') {

			// Normalize relative paths to the current working
			// directory
			tmp = path.resolve(workingDir, gumbyPath);

			// If it exists, set it. Or fall back
			gumbyPath = (fs.existsSync(tmp)) ?
				tmp :
				gumbyPathDefault;

		} else {

			gumbyPath = gumbyPathDefault;

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

			files.push(tmp2);
		}

		// Final init script
		files.push(path.join(gumbyPath, 'js/libs/gumby.init.js'));

		minified = UglifyJS.minify(files, {
		    outSourceMap: "gumby.js.map"
		});

		// Need to print minified.code, minified.map to js/libs/gumby.min.js js/libs/gumby.js.map
		// Write the minified and sourcemap files.
		fs.writeFile(path.join(outPath, 'gumby.min.js'), minified.code, writeErrorHandler);
		fs.writeFile(path.join(outPath, 'gumby.js.map'), minified.map, writeErrorHandler);

	};

}

// Export module.
module.exports = new Claymate();
