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
 *                   WARNING: The more projects you have, the slower the update will be...
 *
 * <no params>       Same as using -nbiup:
 *                   Performs all npm and bower install/update/prune calls
 */

var fs = require("fs");
var _ = require("lodash");
var cmd = require('node-cmd');
var colors = require('colors');
var Promise = require('bluebird');
var commander = require('commander');

commander
.version('0.1.1')
.option('', '')
.option('-n, --npm', 'Perform *only* npm calls', false)
.option('-b, --bower', 'Perform *only* bower calls', false)
.option('', '')
.option('-i, --install', 'Perform *only* install calls', false)
.option('-u, --update', 'Perform *only* update calls', false)
.option('-p, --prune', 'Perform *only* prune calls', false)
.option('', '')
.option('-r, --recursive', 'Perform calls recursively in all subfolders', false)
.option('', 'WARNING: The more projects you have, the slower the update will be...')
.option('', '')
.option('<no params>', 'Same as using -nbiup:')
.option('', 'Performs all npm and bower install/update/prune calls')
.parse(process.argv);

commander.npm = true === commander.npm;
commander.bower = true === commander.bower;
commander.install = true === commander.install;
commander.update = true === commander.update;
commander.prune = true === commander.prune;
commander.recursive = true === commander.recursive;

// If just `update` is executed, run both npm and bower, and run all three iup calls
if (!commander.npm && !commander.bower) {
	commander.npm = commander.bower = true;
}
if (!commander.install && !commander.update && !commander.prune) {
	commander.install = commander.update = commander.prune = true;
}

// commander debug:
// console.log("commander.npm: " + commander.npm);
// console.log("commander.bower: " + commander.bower);
// console.log("commander.install: " + commander.install);
// console.log("commander.update: " + commander.update);
// console.log("commander.prune: " + commander.prune);
// console.log("commander.recursive: " + commander.recursive);

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

	all: function () {
		var self = this;

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

		var promises = _.concat(npmPromises, bowerPromises);
		self.seq(promises).then(function (res) {
			console.log('Done.'.green);
		});
	}
};

update.all();
