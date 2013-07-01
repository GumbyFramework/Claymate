
function Claymate() {

	this.build = function() {

		var UglifyJS = require('uglify-js'),
			gumbyPath = 'public_html/',
			files = [],
			modules = [],
			minified;

		// Master gumby script
		files.push(gumbyPath + 'js/libs/gumby.js');

		// Modules, configurable which shouldbe added.
		for (var i = 0; i < modules.length; i++) {
			files.push(gumbyPath + 'js/libs/ui/' + modules[i] + '.js');
		}

		// Final init script
		files.push(gumbyPath + 'js/libs/gumby.init.js');

		minified = UglifyJS.minify(files, {
		    outSourceMap: "gumby.js.map"
		});

		// Need to print minified.code, minified.map to js/libs/gumby.min.js js/libs/gumby.js.map

	};

}
