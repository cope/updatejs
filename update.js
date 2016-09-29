#!/usr/bin/env node

'use strict';

/**
 * @author: Predrag Stojadinovic <predrag@stojadinovic.net>
 *
 * Usage:
 * -h, --help        output usage information
 * -V, --version     output the version number
 *
 * -n, --npm         Perform *only* npm calls
 * -b, --bower       Perform *only* bower calls
 *
 * -i, --install     Perform *only* install calls
 * -u, --update      Perform *only* update calls
 * -p, --prune       Perform *only* prune calls
 *
 * -r, --recursive   Perform calls recursively in all subfolders
 *                   WARNING: The more projects you have, the longer it will take.
 *
 * -P, --parallel    Perform npm and bower calls in parallel, not consecutively
 *                   WARNING: The output will happen in real time, all mixed up.
 * -f, --buffered    Buffered output for the parallel execution
 *                   WARNING: The output will happen only at the end:
 *                   - once for all npm calls, and once for all bower calls.
 *
 * <no params>       Same as using -nbiup:
 *                   Performs all npm and bower install/update/prune calls in local project
 */

var fs = require("fs");
var _ = require("lodash");
var cmd = require('node-cmd');
var colors = require('colors');
var Promise = require('bluebird');
var commander = require('commander');
var exec = require('child_process').exec;
var spawn = require('child_process').spawn;

commander
.version('0.2.1')
.option('', '')
.option('-n, --npm', 'Perform *only* npm calls', false)
.option('-b, --bower', 'Perform *only* bower calls', false)
.option('', '')
.option('-i, --install', 'Perform *only* install calls', false)
.option('-u, --update', 'Perform *only* update calls', false)
.option('-p, --prune', 'Perform *only* prune calls', false)
.option('', '')
.option('-r, --recursive', 'Perform calls recursively in all subfolders', false)
.option('', 'WARNING: The more projects you have, the longer it will take.')
.option('', '')
.option('-P, --parallel', 'Perform npm and bower calls in parallel, not consecutively', false)
.option('', 'WARNING: The output will happen in real time, all mixed up.')
.option('-f, --buffered', 'Buffered output for the parallel execution', false)
.option('', 'WARNING: The output will happen only at the end:')
.option('', '- once for all npm calls, and once for all bower calls.')
.option('', '')
.option('<no params>', 'Same as using -nbiup:')
.option('', 'Performs all npm and bower install/update/prune calls in local project')
.parse(process.argv);

commander.npm = true === commander.npm;
commander.bower = true === commander.bower;
commander.install = true === commander.install;
commander.update = true === commander.update;
commander.prune = true === commander.prune;
commander.recursive = true === commander.recursive;
commander.parallel = true === commander.parallel;
commander.buffered = true === commander.buffered;

// If just `update` is executed, run both npm and bower, and run all three iup calls
if (!commander.npm && !commander.bower) {
	commander.npm = commander.bower = true;
}
if (!commander.install && !commander.update && !commander.prune) {
	commander.install = commander.update = commander.prune = true;
}
if (commander.parallel && (commander.npm !== commander.bower)) {
	console.log(("Ignoring -P (--paralle) because you only selected " + (commander.npm ? "npm" : "bower") + ".").red);
	commander.parallel = false;
}

// commander debug:
// console.log("commander.npm: " + commander.npm);
// console.log("commander.bower: " + commander.bower);
// console.log("commander.install: " + commander.install);
// console.log("commander.update: " + commander.update);
// console.log("commander.prune: " + commander.prune);
// console.log("commander.recursive: " + commander.recursive);
// console.log("commander.parallel: " + commander.parallel);
// console.log("commander.buffered: " + commander.buffered);

var update = {

	check: function (path, file) {
		try {
			var stats = fs.lstatSync(path + '/' + file);
			return stats.isFile();
		}
		catch (err) {
		}
		return false;
	},

	isValidFolder: function (folder) {
		return "node_modules" !== folder && "bower_components" !== folder;
	},

	find: function (path, file, rootOnly) {
		rootOnly = true === rootOnly && !commander.recursive;

		var ret = [];
		if (this.check(path, file)) {
			ret.push(path);
		}

		var done = rootOnly || (!_.isEmpty(ret) && !commander.recursive);
		if (!done) {
			var id, child, children = fs.readdirSync(path);
			for (id in children) {
				if (children.hasOwnProperty(id)) {
					child = children[id];
					if (this.isValidFolder(child)) {
						if (fs.lstatSync(path + "/" + child).isDirectory()) {
							ret = ret.concat(this.find(path + "/" + child, file));

							if (!_.isEmpty(ret) && !commander.recursive) {
								break;
							}
						}
					}
				}
			}
		}

		return ret;
	},

	goto: function (location, command) {
		process.chdir(location);
		console.log(("For " + command + ", currently in: " + location).red);
		return Promise.defer().resolve(true);
	},

	seq: function (promises) {
		return Promise.map(promises, function (promiseFn) {
			return promiseFn();
		}, {concurrency: 1}); //it will run promises sequentially
	},

	run: function (command, color) {
		var deferred = Promise.defer();
		console.log(color('Running ' + command + '...'));
		cmd.get(command, function (result) {
			result && result.length > 0 && console.log(result);
			console.log(color('- ' + command + ' done.'));
			deferred.resolve(true);
		});
		return deferred.promise;
	},

	build: function (location, command, color) {
		var self = this;
		var promises = [
			function () {
				return self.goto(location, command);
			}
		];
		commander.install && promises.push(function () {
			return self.run(command + ' install', color);
		});
		commander.update && promises.push(function () {
			return self.run(command + ' update', color);
		});
		commander.prune && promises.push(function () {
			return self.run(command + ' prune', color);
		});

		return function () {
			return self.seq(promises);
		};
	},

	params: function () {
		return (commander.install ? "i" : "") +
			(commander.update ? "u" : "" ) +
			(commander.prune ? "p" : "" ) +
			(commander.recursive ? "r" : "");
	},

	all: function () {
		var self = this;

		// Build lists of promises for npm:
		var npmPromises = [];
		if (commander.npm) {
			this.npmLocations = this.find(process.cwd(), 'package.json', true);

			if (!_.isEmpty(this.npmLocations)) {
				_.forEach(this.npmLocations, function (location) {
					npmPromises.push(self.build(location, 'npm', colors.magenta));
				});
			} else {
				console.log("No package.json found, skipping npm calls.".yellow);
			}
		}

		// Build lists of promises for bower:
		var bowerPromises = [];
		if (commander.bower) {
			this.bowerLocations = this.find(process.cwd(), 'bower.json');

			if (!_.isEmpty(this.bowerLocations)) {
				_.forEach(this.bowerLocations, function (location) {
					bowerPromises.push(self.build(location, 'bower', colors.blue));
				});

			} else {
				console.log("No bower.json found, skipping bower calls.".yellow);
			}
		}

		// Parallel processing:
		if (commander.parallel) {
			var params = this.params();

			// Buffered output for parallel processing:
			if (commander.buffered) {
				console.log("Running all npm calls...".magenta);
				exec('update -n' + params, function (error, stdout, stderr) {
					console.log(stdout.magenta);
				});

				console.log("Running all bower calls...".blue);
				exec('update -b' + params, function (error, stdout, stderr) {
					console.log(stdout.blue);
				});

				// Real time, non-buffered output for parallel processing:
			} else {
				var npmChild = exec('update -n' + params);
				npmChild.stdout.on('data', function (data) {
					if (data.indexOf("For") >= 0) {
						console.log(data.red);
					} else if (data.indexOf("Done") >= 0) {
						console.log(data.green);
					} else {
						console.log(data.magenta);
					}
				});

				var bowerChild = exec('update -b' + params);
				bowerChild.stdout.on('data', function (data) {
					if (data.indexOf("For") >= 0) {
						console.log(data.red);
					} else if (data.indexOf("Done") >= 0) {
						console.log(data.green);
					} else {
						console.log(data.blue);
					}
				});
			}
		}

		// Sequential processing:
		else {
			var promises = _.concat(npmPromises, bowerPromises);
			self.seq(promises).then(function (res) {
				console.log('Done.'.green);
			});
		}
	}
};

update.all();
