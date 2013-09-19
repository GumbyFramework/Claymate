# Claymate

Claymate is an optional helper script that wraps common tasks related specifically to [Gumby Framework](https://github.com/GumbyFramework/Gumby) for ease of use.

### Another CLI tool?!

Everyone and their cat these days seem to be putting out a command line tool to help with the process of building websites. We have yeoman, grunt, uglify, guard, compass, and many more. Claymate's purpose is not to replace these tools or even to accomplish much more beyond them, but is rather meant to simplify their use where particulars of gumby come into play.

For example, we think you'll agree that typing this:

	$ claymate install

... is better than typing this:

	$ bower install gumby && \
	mkdir css && \
	mkdir js && \
	mkdir img && \
	mkdir -p sass/var && \
	mkdir fonts && \
	cp bower_components/gumby/sass/gumby.scss sass/ && \
	cp bower_components/gumby/sass/_settings.scss sass/_settings.scss && \
	cp bower_components/gumby/sass/_fonts.scss sass/_font.scss && \
	cp bower_components/gumby/sass/_custom.scss sass/_custom.scss && \
	cp bower_components/gumby/config.rb . && \
	cp -r bower_componenets/gumby/fonts/icons fonts/ && \
	compass compile && \
	echo '{ "build": { "gumbyPath": "bower_components/gumby", "outPath": "js" } }' > gumby.json

And that *still* leaves manual steps for you to complete afterwards which claymate would do for us.

### So what can I do with it?

Right now claymate allows us to do two things: scaffold a new project and concatenate/minify the javascript. Both are tedious tasks to do by hand. Each task is a "subcommand" of claymate, and each in turn accept their own configuration to customize how they act to your use case.

As time goes on, we will add more subcommands to accomplish tasks we notice are repetitive. Before we get into the nitty gritty of each command, let's take a look at how we can install and configure claymate for our envirnoment.

## Getting Claymate

Before begining you will need [nodejs](http://nodejs.org/) version 0.8.0 or higher. Lower versions of nodejs have not been tested. Installation and update instructions for nodejs vary widely depending on what platform you're using and if you want to manage nodejs versions with something like [nvm](https://github.com/creationix/nvm). As such we leave the task to the reader.

> Note: A bug exists with nodejs v0.11.7 in one of claymate's dependencies (uglify-js). Until such time as that bug is fixed in uglify-js, you will not be able to use the 'build' command in that version of nodejs.

Claymate exists as an [npm](https://npmjs.org/) module, so we can easily use that to install it. We reccomend you install claymate globally to save the trouble of specifying the path to claymate every time you invoke it.

	$ npm install claymate

> Sudo is only required in cases where the shared node_modules directory for your system is owned by root. You'll notice when it throws a whole bunch of gobbledy-gook at you with stuff like ENOACCESS and complaints about permissions. A better approach to solving the problem than sudo'ing everything would be to set your npm prefix to a directory you own in $HOME, then adding that to your $PATH. Or more simply, use [nvm](https://github.com/creationix/nvm).


## How Configuration Works

Configuration for claymate is handled with either command line flags or in a JSON file.

### Flags

Flags are always preceded by `--` and come after the subcommand. Additionally a short option, preceded by `-` is defined for each that allows for less typing when using one-off configuration. For example, the following are equivalent:

	$ claymate build --gumbyPath bower_components/gumby
	$ claymate build -g bower_components/gumby
	$ claymate build -g "bower_components/gumby"

As shown above, many flags take an argument which is just a value for the flag. Most of the time, these will be paths, and are simply strings.

Some flags take more than one value. In this case, we use a comma to separate each value, with no spaces inbetween commas and the values.

	$ claymate build --modules retina,toggleswitch,validation

Still other flags are merely on/off switches. In this case they take no arguments at all. You can also negate them by prepending them with `--no-`.

	$ claymate build --buildSourceMap
	$ claymate build --no-buildSourceMap

> **Note:** You can always invoke the claymate command without any subcommands or flags in order to list the possible flags.

### Gumby.json

To make things easier you can specify a gumby.json file in the folder in which you will be running claymate. It's structure closely mirrors that of the command line options. Here is what the examples for the flags shown above would be converted to:

	{
		"build": {
			"gumbyPath": bower_components/gumby",
			"modules": ["retina", "toggleswitch", "validation"],
			"buildSourceMap": true
		}
	}

Each subcommand has it's own list of key-value pairs corresponding to command line flags. All keys are identically named to the long form of the corresponding option, minus the `--`. Prefixing a switch option with `no-` will have no effect, instead use `false` as its value. Also note that a comma separated list becomes a JSON array.

> **Remember:** Wherever you run claymate from, that directory is where it will look for gumby.json. Uppercasing or relocating the gumby.json file to a different directory will make claymate use the default values.

## Subcommand: Install

It is increasingly common practice to use some sort of front-end dependency manager in the vein of npm to manage a project's components. We favor [bower](http://bower.io/) for this task. However, one of the strengths of the gumby framework is the ability to change a few settings and completely change the look of the framework. Since the process of extracting the customizable components of the framework while using bower to maintain isolation from our app is a little complex, we decided to write a subcommand to handle the process for us.

The end result of running this subcommand is a directory structure like the following:

	├── bower_components/
	│   └── gumby/
	├── css/
	│   └── gumby.css
	├── fonts/
	│   └── icons/
	│       ├── entypo.eot
	│       ├── entypo.ttf
	│       └── entypo.woff
	├── img/
	├── js/
	├── sass/
	│   ├── var/
	│   │   └── _settings.scss
	│   ├── _custom.scss
	│   ├── _fonts.scss
	│   └── gumby.scss
	├── config.rb
	├── gumby.json
	├── index.html
	└── ui.html

> **Important!** You should always run this subcommand from an empty directory, as it will overwrite files if they exist already. Claymate will detect if the folder is non-empty and warn you of this.

### Options

> **Note:** If you wish to install gumby as a bower module without the extra processing, all you have to do is `$ bower install gumby`.

#### edge

`--edge`, `-e`

If you want the latest non-released gumby (develop branch), use this.

> **Defaults:** Off.

#### quiet

`--quiet, -q`

If you do not want to see any output from claymate, pass this option.

> **Default:** Off.

## Subcommand: Build

At some point in your project's lifetime you may wish to optimize your javascript files (minification) and combine them all together into one file (concatenation)  with something like [UglifyJS](https://github.com/mishoo/UglifyJS2) . You will find that the order of concatenation of the gumby scripts matters, and that pointing to all of the involved directories is a little annoying.

This subcommand will do all the work for us. It will concatenate and minify the javascript in the following order:

- `js/libs/gumby.js`
- `js/libs/ui/*.js` (the core modules)
- (any custom module files)
- `js/libs/gumby.init.js`
- (any custom non-module files)

It can also optionally output a sourcemap file.

### Options

#### gumbyPath

`--gumbyPath, -g` `path/to/gumby`

In order to find gumby's javascript files, claymate needs to know where the root of the gumby folder is. For example, if we are in `~/Sites/new-site-project/` and have gumby installed at `~/Sites/new-site-project/public_html/bower_components/gumby`, we can specify that by passing the relative path like so:

	$ claymate build --gumbyPath public_html/bower_components/gumby


> **Default:** The current directory will be used (such as if you downloaded a copy of gumby to your project). If you scaffolded your project with `claymate install`, then a `gumby.json` file will have been written for you that points to `bower_componenets/gumby`.

#### outPath

`--outPath, -o` `path/to/output/js`

This allows us to dictate where to output the final minified, concatenated file and its sourcemap. The rules for the path are the same as that for the gumbyPath argument.

> **Default:** The files will be written to the current directory if you do not specify. If you scaffolded your project with `claymate install`, then a `gumby.json` file will have been written for you that points to `js`.

#### modules

`--modules, -m` `list,of,ui,modules`

This is a comma separated list of the names of the core gumby UI modules you wish to be included. Names of modules should be specified without the `.js` ending, and can be written without their `gumby.` or `jquery.` prefixes. For example, to include `js/libs/ui/jquery.validation.js` and `js/libs/ui/retina.js`, one would write the following:

	$ claymate build --modules retina,validation

> **Default:** By default, all modules located in `$gumbyPath/js/libs/ui/` are included.

#### add-ons

`--add-ons, --addons, -a` `path/to/addon/a.js,path/to/addon/b.js`

This allows us to specify additional add-ons written specifically to work with gumby. An example of that is the Parallax module, which is published as a separate bower package. Assuming we install it with bower, one need only do the following:

	$ claymate build --addons bower_components/gumby-parallax/gumby.parallax.js

> **Default:** Empty.

#### files

`--files, -f` `path/to/file/a.js,path/to/file/b.js`

This is a comma separated list of additional javascript files. An example could be the `js/plugins.js` and `js/main.js` or any other javascript specific to your project. Rules for the arguments are the same as for `--addons`.

> **Default:** Empty.

#### buildSourceMap

`--buildSourceMap, -s`

No argument needs to be passed to this flag. Its presence enables the creation of sourcemaps along with the minified, concatenated file. To enable sourcemaps therefore, one writes:

	$ claymate build --buildSourceMap

> **Default:** Don't build a sourcemap.


#### quiet

`--quiet, -q`

Sometimes we need to use an option just once. Passing this flag will supress the helpful hint about the gumby.json file.

> **Default:** Off.

## I'm a developer, and I have an itch to scratch

Whether you have an idea for a subcommand, a bugfix, or just a little feature to add to claymate then please! By all means, fork our repository and give it a go!

In github, fork [our repository](https://github.com/GumbyFramework/Claymate), then clone it locally:

	$ git clone git@github.com:<your-username>/Claymate.git

Once cloned, go into the project directory and add the official respository as a new remote.

	$ cd Claymate
	$ git remote add upstream https://github.com/GumbyFramework/Claymate.git

You can set your copy of claymate as the global installation of claymate by linking, taking care to remove the globally installed claymate if it exists already.

	$ npm -g uninstall claymate
	$ npm link

The repository uses the [Git Flow](http://nvie.com/posts/a-successful-git-branching-model/) method for organizing branches. If you are not used to it, just treat the develop branch like you normally would the master branch of another project. That is, develop is the main integration point, which you should branch off for your work, then pull request to. Never commit on develop or master in your fork, as you will then have the headache of merge conflicts every time you pull from upstream. You can use any name you want for topic branches, as they will not appear in the official repository.

> **Note:** Before spending a lot of time on a large subcommand, please propose the idea in a github issue first. If the subcommand is not a fit for the purpose of claymate, we can discuss it ahead of time and perhaps collaborate on ways to reshape it to fit.

## MIT Open Source License

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.



