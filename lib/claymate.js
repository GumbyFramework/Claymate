
function Claymate() {

	"use strict";

	var fs = require("fs"),
		wrench = require('wrench'),
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
	 * Validates input to the build method.
	 * @param  {Object} buildInput Object literal of options to be cleaned.
	 * @return {Object}            The cleaned options.
	 */
	function validateBuildInput(buildInput) {

		var opts = {
			gumbyPath: '',
			outPath: '',
			modules: [],
			extraModules: [],
			includeSourceMap: false
		};

		// Check for a passed directory
		if (typeof buildInput.gumbyPath === 'string') {

			// If the ui dir doesnt exist, the rest don't since
			// the rest are all parents of that dir.
			if (!fs.existsSync(path.join(buildInput.gumbyPath, 'js/libs/ui'))) {
				throw new Error('Path ' + buildInput.gumbyPath + ' does not exist or does not contain gumby.');
			}

			opts.gumbyPath = buildInput.gumbyPath;

		}

		// Check for path to write output to
		// Fall back to current directory.
		if (typeof buildInput.outPath === 'string') {

			if (fs.existsSync(buildInput.outPath)) {
				opts.outPath = buildInput.outPath;
			}

		}

		// Check for passed modules, fall back
		// to all modules in ui directory
		if (util.isArray(buildInput.modules)) {

			opts.modules = buildInput.modules;

		} else {

			opts.modules = fs.readdirSync(path.join(opts.gumbyPath, 'js/libs/ui'));

		}

		// Check for passed extra modules.
		if (util.isArray(buildInput.extraModules)) {

			opts.extraModules = buildInput.extraModules;

		}

		// Force boolean
		if (typeof buildInput.includeSourceMap !== 'undefined') {

			opts.includeSourceMap = !!buildInput.includeSourceMap;

		}

		return opts;

	}

	function copyFile(from, to, modifyCallback) {

		console.log('Copying file ' + from + ' to ' + to);

		var file = fs.readFileSync(from, {encoding: 'utf8'});

		if (typeof modifyCallback === 'function') {
			console.log('\tRewriting paths to bower_components/gumby');
			file = modifyCallback(file);
		}

		fs.writeFileSync(to, file);

	}

	function createDirectory(dir) {

		if (fs.existsSync(dir)) {

			console.log('Directory already exists: ' + dir);

		} else {

			console.log('Creating directory: ' + dir);

			if (dir.indexOf('/') === -1) {
				fs.mkdirSync(dir, '0755');
			} else {
				wrench.mkdirSyncRecursive(dir, '0755');
			}

		}

	}

	function createStandardDirs() {

		var dirs = ['css', 'js', 'img', 'sass/var', 'fonts/icons'];

		for (var i = dirs.length - 1; i >= 0; i--) {
			createDirectory(dirs[i]);
		}

	}

	function copyGumbyFiles() {

		// Generate directory skeleton
		createStandardDirs();

		// Example/starter html files
		copyFile('bower_components/gumby/ui.html', 'ui.html', updateHTMLFilePaths);
		copyFile('ui.html', 'index.html', removeIndexContent);

		// Styles they can customize.
		copyFile('bower_components/gumby/sass/gumby.scss', 'sass/gumby.scss', updateSassFilePaths);
		copyFile('bower_components/gumby/sass/_fonts.scss', 'sass/_fonts.scss');
		copyFile('bower_components/gumby/sass/_custom.scss', 'sass/_custom.scss');
		copyFile('bower_components/gumby/sass/var/_settings.scss', 'sass/var/_settings.scss');

		// Compass config
		copyFile('bower_components/gumby/config.rb', 'config.rb', updateExtensionsPath);

		// Fonts
		wrench.copyDirSyncRecursive('bower_components/gumby/fonts/icons', 'fonts/icons', {
			forceDelete: true,
			excludeHiddenUnix: true,
			preserveFiles: true,
			inflateSymlinks: false
		});

		// Run compass compile
		var exec = require('child_process').exec;

		exec("compass compile", function (error, stdout, stderr) {
			console.log('Compiling scss:\n' + stdout);
			if (error !== null) {
				console.log(stderr);
				console.log(error);
			}
		});

	}

	function updateHTMLFilePaths(html) {

		var cheerio = require('cheerio'),
			$ = cheerio.load(html);

		// Rebase included css paths
		$('link[rel="stylesheet"]').each(function() {

			var $this = $(this),
				href  = $this.attr('href');

			$this.attr('href', 'bower_components/gumby/' + href);

		});

		// Rebase included js paths
		$('script').each(function() {

			var $this = $(this),
				src   = $this.attr('src'),
				content = $this.html();

			if (typeof src !== 'undefined') {

				// Simply rewrite the source attribute
				$this.attr('src', 'bower_components/gumby/' + src);

			} else if (typeof content !== 'undefined') {

				// Use regex to rewrite scripts that
				// would be inserted via document.write()
				content = content.replace(/src=['"](?!\/\/|http)([^'"]+?)['"]/gi, 'src="bower_components/gumby/$1"');
				$this.html(content);

			}

		});

		// Send back the modified string.
		return $.html();

	}

	function removeIndexContent(html) {

		var cheerio = require('cheerio'),
			$ = cheerio.load(html);

		$('body > *').each(function() {

			var $this = $(this);

			if (!$this.is('script')) {

				$this.remove();

			}

		});

		// Send back the modified string.
		return $.html();

	}

	function updateSassFilePaths(scss) {

		return scss.replace(/@import\s+['"](?!modular-scale|compass|fonts|custom|var\/settings)([^'"]*?)['"]/gi, '@import "../bower_components/gumby/sass/$1"');

	}

	function updateExtensionsPath(config) {

		return config.replace(/extensions_dir\s*=\s*['"]([^'"]+?)['"]/i, 'extensions_dir = "bower_components/gumby/$1"');

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
	 * @param {Object} opts An object literal of options including the following params:
	 * @param {Array} modules An array of the modules that will be included, defaults to all.
	 * @param {Array} extraModules An array of any external modules that will be included.
	 * @param {String} gumbyPath The path to gumby that will be used, defaults to current dir + /components/gumby
	 * @param {String} outPath What path to write minified/sourcemap files to.
	 * @param {Boolean} includeSourceMap Whether to write a source map. Defaults to true
	 * @return {void} Writes minified file and optionally its sourcemap.
	 */
	this.build = function(opts) {

		var UglifyJS = require('uglify-js'),
			files = [],
			minOpts = {},
			minified, tmp, tmp2;

		// Validate input
		opts = validateBuildInput(opts);

		// Master gumby script
		files.push(path.join(opts.gumbyPath, 'js/libs/gumby.js'));

		// Modules, configurable which shouldbe added.
		for (var i = 0; i < opts.modules.length; i++) {

			tmp = path.basename(opts.modules[i], '.js');

			tmp2 = path.join(
				opts.gumbyPath,
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
		for (var j = 0; j < opts.extraModules.length; j++) {

			if (fs.existsSync(opts.extraModules[j])) {
				files.push(opts.extraModules[j]);
			}

		}

		// Final init script
		files.push(path.join(opts.gumbyPath, 'js/libs/gumby.init.js'));

		// Optionally request sourcemap
		if (opts.includeSourceMap) {
			minOpts.outSourceMap = 'gumby.js.map';
		}

		minified = UglifyJS.minify(files, minOpts);

		// Write the minified file.
		fs.writeFile(path.join(opts.outPath, 'gumby.min.js'), minified.code, writeErrorHandler);

		// Write the sourcemap file.
		if (opts.includeSourceMap) {

			// Minified.code apparently doesn't already contain this comment
			// pointing to the sourcemap file. Let's append it if theyre on.
			minified.code += '\n//# sourceMappingURL=' + minOpts.outSourceMap;

			fs.writeFile(path.join(opts.outPath, 'gumby.js.map'), minified.map, writeErrorHandler);

		}

	};

	this.install = function(opts) {

		var bower = require('bower'),
			bowerPaths = [
				'gumby'
			];

		// Install gumby with bower
		bower.commands
		.install(bowerPaths)
		/*.on('log', function (log) {

		})*/
		.on('error', function (error) {
			console.log(error);
		})
		.on('end', copyGumbyFiles);

	};

}

// Export module.
module.exports = new Claymate();
