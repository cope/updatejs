#!/usr/bin/env node

'use strict';

var fs = require("fs");
var _ = require("lodash");
var cmd = require('node-cmd');
var colors = require('colors');
var Promise = require('bluebird');
var exec = require('child_process').exec;
var spawn = require('child_process').spawn;

var options = {};

module.exports = {
	update: update
};

function update(commander) {
	options = commander;

	// Build lists of promises for npm:
	var npmPromises = [];
	if (options.npm) {
		var npmLocations = find(process.cwd(), 'package.json', true);

		if (!_.isEmpty(npmLocations)) {
			_.forEach(npmLocations, function (location) {
				npmPromises.push(build(location, 'npm', colors.magenta));
			});
		} else {
			console.log("No package.json found, skipping npm calls.".yellow);
		}
	}

	// Build lists of promises for bower:
	var bowerPromises = [];
	if (options.bower) {
		var bowerLocations = find(process.cwd(), 'bower.json');

		if (!_.isEmpty(bowerLocations)) {
			_.forEach(bowerLocations, function (location) {
				bowerPromises.push(build(location, 'bower', colors.blue));
			});

		} else {
			console.log("No bower.json found, skipping bower calls.".yellow);
		}
	}

	// Parallel processing:
	if (options.parallel) {
		var params = params();

		// Buffered output for parallel processing:
		if (options.buffered) {
			console.log("Running all npm calls...".magenta);
			exec('updatejs -n' + params, function (error, stdout, stderr) {
				console.log(stdout.magenta);
			});

			console.log("Running all bower calls...".blue);
			exec('updatejs -b' + params, function (error, stdout, stderr) {
				console.log(stdout.blue);
			});

			// Real time, non-buffered output for parallel processing:
		} else {
			var npmChild = exec('updatejs -n' + params);
			npmChild.stdout.on('data', function (data) {
				if (data.indexOf("For") >= 0) console.log(data.red);
				else if (data.indexOf("Done") >= 0) console.log(data.green);
				else console.log(data.magenta);
			});

			var bowerChild = exec('updatejs -b' + params);
			bowerChild.stdout.on('data', function (data) {
				if (data.indexOf("For") >= 0) console.log(data.red);
				else if (data.indexOf("Done") >= 0) console.log(data.green);
				else console.log(data.blue);

			});
		}
	}

	// Sequential processing:
	else {
		var promises = _.concat(npmPromises, bowerPromises);
		seq(promises)
			.then(function () {
				console.log('Done.'.green);
			});
	}
}

function check(path, file) {
	try {
		var stats = fs.lstatSync(path + '/' + file);
		return stats.isFile();
	}
	catch (err) {
	}
	return false;
}

function isValidFolder(folder) {
	return "node_modules" !== folder && "bower_components" !== folder;
}

function find(path, file, rootOnly) {
	rootOnly = true === rootOnly && !options.recursive;

	var ret = [];
	if (check(path, file)) ret.push(path);

	var done = rootOnly || (!_.isEmpty(ret) && !options.recursive);
	if (!done) {
		var id, child, children = fs.readdirSync(path);
		for (id in children) {
			if (children.hasOwnProperty(id)) {
				child = children[id];
				if (isValidFolder(child)) {
					if (fs.lstatSync(path + "/" + child).isDirectory()) {
						ret = ret.concat(find(path + "/" + child, file));
						if (!_.isEmpty(ret) && !options.recursive) break;
					}
				}
			}
		}
	}
	return ret;
}

function goto(location, command) {
	process.chdir(location);
	console.log(("For " + command + ", currently in: " + location).red);
	return Promise.resolve(true);
}

function seq(promises) {
	return Promise
		.map(promises, function (promiseFn) {
			return promiseFn();
		}, {concurrency: 1}); //it will run promises sequentially
}

function run(command, color) {
	return new Promise(function (resolve, reject) {
		console.log(color('Running ' + command + '...'));
		cmd.get(command, function (result) {
			result && result.length > 0 && console.log(result);
			console.log(color('- ' + command + ' done.'));
			return resolve(true);
		});
	});
}

function build(location, command, color) {
	var promises = [
		function () {
			return goto(location, command);
		}
	];
	options.install && promises.push(function () {
		return run(command + ' install', color);
	});
	options.update && promises.push(function () {
		return run(command + ' update', color);
	});
	options.prune && promises.push(function () {
		return run(command + ' prune', color);
	});

	return function () {
		return seq(promises);
	};
}

function params() {
	return (options.install ? "i" : "") +
		(options.update ? "u" : "") +
		(options.prune ? "p" : "") +
		(options.recursive ? "r" : "");
}
