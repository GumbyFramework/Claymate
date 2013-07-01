
function Claymate() {

	"use strict";

	var fs = require("fs"),
		path = require("path"),
		workingDir = process.cwd(),
		gumbyPathDefault = path.join(workingDir, '/components/gumby/');

	function writeErrorHandler(error) {

		if (error) {
			throw error;
		}

	}

	function checkGumbyDirs(rootPath) {

		// If the ui dir doesnt exist, the rest don't since
		// the rest are all parents of that dir.
		if (!fs.existsSync(path.join(rootPath, 'js/libs/ui'))) {
			throw new Error('Path ' + rootPath + ' does not exist or does not contain gumby.');
		}

	}

	this.build = function(modules, gumbyPath) {

		var UglifyJS = require('uglify-js'),
			files = [],
			minified;

		// Check for a passed directory
		if (typeof gumbyPath === 'string') {

			// Normalize relative paths to the current working
			// directory
			var tmp = path.resolve(workingDir, gumbyPath);

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
		if (typeof modules !== 'array') {

			modules = fs.readdirSync(path.join(gumbyPath, 'js/libs/ui'));

		}

		// Master gumby script
		files.push(path.join(gumbyPath, 'js/libs/gumby.js'));

		// Modules, configurable which shouldbe added.
		for (var i = 0; i < modules.length; i++) {
			files.push(path.join(gumbyPath, 'js/libs/ui/', path.basename(modules[i], '.js') + '.js'));
		}

		// Final init script
		files.push(path.join(gumbyPath, 'js/libs/gumby.init.js'));

		minified = UglifyJS.minify(files, {
		    outSourceMap: "gumby.js.map"
		});

		// Need to print minified.code, minified.map to js/libs/gumby.min.js js/libs/gumby.js.map
		// Write the minified and sourcemap files.
		fs.writeFile(path.join(gumbyPath, 'js/gumby.min.js'), minified.code, writeErrorHandler);
		fs.writeFile(path.join(gumbyPath, 'js/gumby.js.map'), minified.map, writeErrorHandler);

	};

}

// Export module.
module.exports = new Claymate();
