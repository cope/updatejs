#!/usr/bin/env node

'use strict';

/**
 * @author: Predrag Stojadinovic <predrag@stojadinovic.net>
 *
 * Usage:
 * -h, --help        output usage information
 * -V, --version     output the version number
 *
 * -n, --npm         Perform *only* npm install/update/prune calls
 * -b, --bower       Perform *only* bower install/update/prune calls
 *
 * -nb, <no params>  Perform both npm and bower install/update/prune calls
 */

var fs = require("fs");
var cmd = require('node-cmd');
var colors = require('colors');
var Promise = require('bluebird');
var program = require('commander');

program
.version('0.0.3')
.option('', '')
.option('-n, --npm', 'Perform *only* npm install/update/prune calls', false)
.option('-b, --bower', 'Perform *only* bower install/update/prune calls', false)
.option('', '')
// .option('-r, --recursive', 'Perform bower install/update/prune calls recursively')
// .option('', 'Does not work with the -n option')
// .option('', '')
.option('-nb, <no params>', 'Perform both npm and bower install/update/prune calls')
.parse(process.argv)
;

// If just `update` is executed, run npm and bower
if (!program.npm && !program.bower) {
	program.npm = true;
	program.bower = true;
}

var update = {
	run: function (command, msg1, msg2) {
		var deferred = Promise.defer();
		console.log(msg1);
		cmd.get(command, function (result) {
			result && result.length > 0 && console.log(result);
			console.log(msg2);
			deferred.resolve(true);
		});
		return deferred.promise;
	},
	seq: function (promises) {
		return Promise.map(promises, function (promiseFn) {
			return promiseFn(); //make sure that here You return Promise
		}, {concurrency: 1}); //it will run promises sequentially
	},
	checkNPM: function () {
		this.hasPackageJSON = false;
		try {
			var stats = fs.lstatSync(process.cwd() + '/package.json');
			this.hasPackageJSON = stats.isFile();
		}
		catch (err) {
		}
	},
	checkBower: function (path) {
		try {
			var stats = fs.lstatSync(path + '/bower.json');
			return stats.isFile();
		}
		catch (err) {
		}
		return false;
	},
	isValidFolder: function (folder) {
		return "node_modules" !== folder && "bower_components" !== folder;
	},
	findBower: function (path) {
		if (this.checkBower(path)) {
			this.bowerLocation = path;
		} else {
			var files = fs.readdirSync(path);
			var file, id, x = 0, newName;
			for (id in files) {
				if (files.hasOwnProperty(id)) {
					file = files[id];
					var isDir = fs.lstatSync(path + "/" + file).isDirectory();
					var isValid = this.isValidFolder(file);
					if (isDir && isValid) {
						if (this.checkBower(path + "/" + file)) {
							this.bowerLocation = path + "/" + file;
						} else {
							!this.bowerLocation && this.findBower(path + "/" + file);
						}
					}
				}
			}
		}
	},
	bower: function () {
		this.bowerLocation = null;
		this.findBower(process.cwd());

		if (this.bowerLocation) {
			process.chdir(this.bowerLocation);

			var self = this;
			return [
				function () {
					return self.run('bower install', 'Running bower install...'.blue, 'Running bower install done.'.blue);
				},
				function () {
					return self.run('bower update', 'Running bower update...'.blue, 'Running bower update done.'.blue);
				},
				function () {
					return self.run('bower prune', 'Running bower prune...'.blue, 'Running bower prune done.'.blue);
				}
			];
		} else {
			console.log("No bower.json found, skipping bower calls.".underline.yellow);
		}
		return [];
	},
	npm: function () {
		if (true === this.hasPackageJSON) {
			var self = this;
			return [
				function () {
					return self.run('npm install', 'Running npm install...'.magenta, 'Running npm install done.'.magenta);
				},
				function () {
					return self.run('npm update', 'Running npm update...'.magenta, 'Running npm update done.'.magenta);
				},
				function () {
					return self.run('npm prune', 'Running npm prune...'.magenta, 'Running npm prune done.'.magenta);
				}
			];
		} else {
			console.log("No package.json found, skipping npm calls.".underline.yellow);
		}
		return [];
	},
	all: function () {
		this.checkNPM();
		var promises = [];
		if (program.bower) {
			promises = promises.concat(this.bower());
		}
		if (program.npm) {
			promises = promises.concat(this.npm());
		}
		this.seq(promises).then(function (res) {
			console.log('Done.'.green);
		});
	}
};

update.all();
