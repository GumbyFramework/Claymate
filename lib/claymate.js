
function Claymate() {

	"use strict";

	var fs = require("fs"),
		wrench = require('wrench'),
		path = require("path"),
		util = require('util'),
		logger = require('./logger.js'),
		eol = require('os').EOL,
		workingDir = process.cwd(),
		opts;

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
			addons: [],
			files: [],
			buildSourceMap: false,
			quiet: false
		};

		// Check for a passed directory
		if (typeof buildInput.gumbyPath === 'string') {

			opts.gumbyPath = buildInput.gumbyPath;

		}

		// If the ui dir doesnt exist, the rest don't since
		// the rest are all parents of that dir.
		if (!fs.existsSync(path.join(opts.gumbyPath, 'js/libs/ui'))) {
			logger.error('Path "' + opts.gumbyPath + '" does not exist or does not contain gumby.');
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
		if (util.isArray(buildInput.addons)) {

			opts.addons = buildInput.addons;

		}

		// Check for passed extra files.
		if (util.isArray(buildInput.files)) {

			opts.files = buildInput.files;

		} else {

			opts.files = [];

		}


		// Force boolean
		if (typeof buildInput.buildSourceMap !== 'undefined') {

			opts.buildSourceMap = !!buildInput.buildSourceMap;

		}

		if (typeof buildInput.quiet !== 'undefined') {

			if (!!buildInput.quiet) {
				logger.hush();
			}

		}

		return opts;

	}

	function makeModulePath(gumbyPath, filename) {

		return path.join(
			gumbyPath,
			'js/libs/ui/',
			// Look if there is a gumby. or jquery. in front of the module
			// name, if not, assume gumby. should be prepended.
			filename + '.js'
		);

	}

	function copyFile(from, to, modifyCallback) {

		logger.info('Copying file ' + from + ' to ' + to);

		var file = fs.readFileSync(from, 'utf8');

		if (typeof modifyCallback === 'function') {
			logger.indent();
			logger.info('Rewriting paths to bower_components/gumby');
			logger.unindent();
			file = modifyCallback(file);
		}

		fs.writeFileSync(to, file);

	}

	function createDirectory(dir) {

		if (fs.existsSync(dir)) {
			logger.warning('Directory already exists: ' + dir);
		} else {
			logger.info('Creating directory: ' + dir);

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
		copyFile('bower_components/gumby/index.html', 'index.html', updateHTMLFilePaths);

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
			if (!opts.quiet) {
				console.log('Compiling scss:' + eol + stdout);
			}
			if (error !== null) {
				logger.warning(stderr);
				logger.warning(error);
			}
		});

		// Write gumby.json file.
		var defaultOpts = {
				'build': {
					'gumbyPath': 'bower_components/gumby',
					'outPath': 'js'
				}
			},
			JSONOpts = JSON.stringify(defaultOpts, null, "\t");

		fs.open('gumby.json', 'w', '0644', function(err, fd) {

			logger.info('Writing gumby.json');
			fs.writeSync(fd, JSONOpts);

		});

	}

	function updateHTMLFilePaths(html) {

		var cheerio = require('cheerio'),
			$ = cheerio.load(html);

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

		// HACK: Fix cheerio error where double script
		// end tags are output.
		var html = $.html();
		html = html.replace(/<\/script><\/script>/g, '</script>');

		// Send back the modified string.
		return html;

	}

	function removeIndexContent(html) {

		var cheerio = require('cheerio'),
			$ = cheerio.load(html);

		// Get rid of everything ui.html specific
		$('body > *:not(script), style').remove();

		// Send back the modified string.
		return $.html();

	}

	function updateSassFilePaths(scss) {

		return scss.replace(/@import\s+['"](?!modular-scale|compass|fonts|custom|var\/settings)([^'"]*?)['"]/gi, '@import "../bower_components/gumby/sass/$1"');

	}

	function updateExtensionsPath(config) {

		return config.replace(/extensions_dir\s*=\s*['"]([^'"]+?)['"]/i, 'extensions_dir = "bower_components/gumby/$1"');

	}

	function actuallyInstall() {

		// Start the install process.
		var bower = require('bower'),
			bowerPaths = (!!opts.edge) ? ['gumby#develop'] : ['gumby'];

		// Install gumby with bower
		bower.commands
		.install(bowerPaths)
		.on('error', function (error) {
			logger.error(error);
		})
		.on('end', copyGumbyFiles);

	}

	/**
	 * Retrieves configuration in gumby.json
	 * @return {Object} The configuration object.
	 */
	this.getJSONConfig = function() {

		var configPath = path.join(workingDir, 'gumby.json'),
			config = {};

		if (fs.existsSync(configPath)) {
			config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
		}

		return config;
	};

	/**
	 * This method will build the gumby js assets.
	 * @param {Object} opts An object literal of options including the following params:
	 * @param {Array} modules An array of the modules that will be included, defaults to all.
	 * @param {Array} addons An array of any external modules that will be included.
	 * @param {String} gumbyPath The path to gumby that will be used, defaults to current dir + /components/gumby
	 * @param {String} outPath What path to write minified/sourcemap files to.
	 * @param {Boolean} buildSourceMap Whether to write a source map. Defaults to true
	 * @return {void} Writes minified file and optionally its sourcemap.
	 */
	this.build = function(opts) {

		var UglifyJS = require('uglify-js'),
			files = [],
			minOpts = {},
			minified, tmp, tmp2;

		// Validate input
		opts = validateBuildInput(opts);

		logger.info('Concatenating and minifying js:');
		logger.indent();

		// Master gumby script
		logger.info('Adding file ' + path.join(opts.gumbyPath, 'js/libs/gumby.js'));
		files.push(path.join(opts.gumbyPath, 'js/libs/gumby.js'));

		// Modules, configurable which shouldbe added.
		for (var i = 0; i < opts.modules.length; i++) {

			tmp = path.basename(opts.modules[i], '.js');
			tmp2 = makeModulePath(opts.gumbyPath, tmp);

			if (fs.existsSync(tmp2)) {
				logger.info('Adding file ' + tmp2);
				files.push(tmp2);
			} else {

				var modulePathGumby = makeModulePath(opts.gumbyPath, 'gumby.' + tmp),
					modulePathjQuery = makeModulePath(opts.gumbyPath, 'jquery.' + tmp);

				if (fs.existsSync(modulePathGumby)) {
					logger.info('Adding file ' + modulePathGumby);
					files.push(modulePathGumby);
				} else if (fs.existsSync(modulePathjQuery)) {
					logger.info('Adding file ' + modulePathjQuery);
					files.push(modulePathjQuery);
				} else {
					logger.warning('Unable to find core module corresponding to ' + tmp);
				}

			}

		}

		// External modules, which will be passed as paths
		for (var j = 0; j < opts.addons.length; j++) {

			if (fs.existsSync(opts.addons[j])) {
				logger.info('Adding file ' + opts.addons[j]);
				files.push(opts.addons[j]);
			} else {
				logger.warning('Unable to find external module ' + tmp);
			}

		}

		// Final init script
		logger.info('Adding file ' + path.join(opts.gumbyPath, 'js/libs/gumby.init.js'));
		files.push(path.join(opts.gumbyPath, 'js/libs/gumby.init.js'));

		// External files, which will be passed as paths
		for (var h = 0; h < opts.files.length; h++) {

			if (fs.existsSync(opts.files[h])) {
				logger.info('Adding file ' + opts.files[h]);
				files.push(opts.files[h]);
			} else {
				logger.warning('Unable to find external file ' + tmp);
			}

		}

		// Optionally request sourcemap
		if (opts.buildSourceMap) {
			minOpts.outSourceMap = 'gumby.js.map';
			minOpts.sourceRoot = '/';
		}

		minified = UglifyJS.minify(files, minOpts);

		// Write the sourcemap file.
		if (opts.buildSourceMap) {

			// Minified.code apparently doesn't already contain this comment
			// pointing to the sourcemap file. Let's append it if theyre on.
			minified.code +=  eol + "//# sourceMappingURL=" + minOpts.outSourceMap;

			logger.info('Adding sourcemap ' + path.join(opts.outPath, 'gumby.js.map'));
			fs.writeFile(path.join(opts.outPath, 'gumby.js.map'), minified.map, writeErrorHandler);

		}

		// Write the minified file.
		fs.writeFile(path.join(opts.outPath, 'gumby.min.js'), minified.code, writeErrorHandler);

		logger.unindent();
		logger.info('Finished generating ' + path.join(opts.outPath, 'gumby.min.js'));

		// Let the user know we can save these in a gumby.json..
		// but only if they don't have one saved already.
		if (!fs.existsSync(path.join(workingDir, '/gumby.json')) && !opts.quiet) {

			var message = "You can use these same options without typing them out all the time by saving the following to a gumby.json file:",
				printOpts = { "build": opts };

			logger.info(message);
			logger.info(JSON.stringify(printOpts, null, "\t"));

		}

	};

	this.install = function(installOpts) {

		opts = installOpts;

		// Enforce quiet flag.
		if (!!opts.quiet) {
			logger.hush();
		}

		// Check if we're not in an empty dir
		var filesInWorkingDir = fs.readdirSync(workingDir);

		if (filesInWorkingDir.length) {

			// Prompt the user if they want to continue
			var readline = require('readline'),
				rl = readline.createInterface({
					input: process.stdin,
					output: process.stdout
				}),
				message = "The current directory is not empty. Results of this operation will likely be hard to sort out if you don't know what you're doing. Files may be overwritten. Would you like to continue? [y/N] ";

			rl.question(message, function(answer) {

				if (answer.trim() === 'y') {
					actuallyInstall();
				}

				rl.close();

			});

		} else {

			actuallyInstall();

		}

	};

}

// Export module.
module.exports = new Claymate();
