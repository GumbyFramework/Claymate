#Claymate

Claymate is an optional helper script that wraps common tasks related specifically to [Gumby Framework](https://github.com/GumbyFramework/Gumby) for ease of use.

> Note that this project is currently in alpha state and changes to options and functionality are in constant flux until official release.

##Installation

Use [npm](https://npmjs.org/) to install claymate globally or locally:

	npm [-g] install claymate


##Comands

Here are short descriptions of the commands available. Use the command without any arguments (`$ claymate`) to see full details.

- `build` - Concatenates and minifies all gumby javascript assets in the proper order utilizing [uglify-js](https://github.com/mishoo/UglifyJS2). Accepts further options to specify which modules to include.

##Configuration

All command line options for a given subcommand can be set in a JSON configuration file called `gumby.json`, typically located at the root of your project. 

> Note that claymate will look for this file in the directory in which you run claymate, so keeping it in the root of the project is not a requirement. 

As an example, the following command:

	$ claymate build --gumbyPath public_html \
		--outPath public_html/js \
		--modules fittext,retina \
		--extraModules public_html/gumby-parallax/gumby.parallax.js
	
Is equivalent to running `$ claymate build` with the following JSON in `gumby.json`:

	{
		"build": {
			"modules": ["fittext", "retina"],
			"gumbyPath": "public_html",
			"outPath": "public_html/js",
			"extraModules": ["public_html/gumby-parallax/gumby.parallax.js"]
		}
	}

##License

The MIT License (MIT)

Copyright (c) 2013 Digital Surgeons

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.
