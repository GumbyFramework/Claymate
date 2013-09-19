function Logger() {

	"use strict";

	var quiet = false,
		indentation = 0;

	function outputIndents() {

		var tabs = '';


		for (var i = 0; i < indentation; i++) {
			tabs += '   ';
		}

		return tabs;

	}

	this.info = function(message) {
		if (!quiet) {
			console.log(outputIndents() + message);
		}
	};

	this.warning = function(message) {
		console.warn(outputIndents() + 'WARNING: ' + message);
	};

	this.error = function(message) {
		console.error(outputIndents() + 'ERROR: ' + message);
		process.exit(1);
	}

	this.indent = function() {
		indentation++;
	};

	this.unindent = function() {
		indentation--;
	};

	this.hush = function() {
		quiet = true;
	}

}

// Export module.
module.exports = new Logger();
