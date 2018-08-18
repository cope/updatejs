#!/usr/bin/env node

"use strict";

const fs = require("fs");
const _ = require("lodash");
const cmd = require("node-cmd");
const colors = require("colors");
const Promise = require("bluebird");
const exec = require("child_process").exec;

let options = {};

const goto = (location, command) => {
	process.chdir(location);
	console.log(("For " + command + ", currently in: " + location).red);
	return Promise.resolve(true);
};

const run = (command, color) => new Promise((resolve, reject) => {
	console.log(color("Running " + command + "..."));
	cmd.get(command, (result) => {
		result && result.length > 0 && console.log(result);
		console.log(color("- " + command + " done."));
		return resolve(true);
	});
});

const seq = (promises) => Promise.map(promises, (promiseFn) => promiseFn(), {concurrency: 1}); //it will run promises sequentially

const build = (location, command, color) => {
	let promises = [() => goto(location, command)];
	options.install && promises.push(() => run(command + " install", color));
	options.update && promises.push(() => run(command + " update", color));
	options.prune && promises.push(() => run(command + " prune", color));
	return () => seq(promises);
};

const params = () => {
	let p = {i: options.install, u: options.update, p: options.prune, r: options.recursive,};
	let c = "";
	_.forEach(p, (v, k) => c += v ? k : "");
	return c;
};

const check = (path, file) => {
	try {
		let stats = fs.lstatSync(path + "/" + file);
		return stats.isFile();
	} catch (err) {
		return false;
	}
};

const isValidFolder = (folder) => "node_modules" !== folder && "bower_components" !== folder;

const find = (path, file, rootOnly) => {
	rootOnly = true === rootOnly && !options.recursive;

	let ret = [];
	if (check(path, file)) ret.push(path);

	let done = rootOnly || (!_.isEmpty(ret) && !options.recursive);
	if (!done) {
		let child, children = fs.readdirSync(path);
		for (child of children) {
			if (isValidFolder(child)) {
				if (fs.lstatSync(path + "/" + child).isDirectory()) {
					ret = ret.concat(find(path + "/" + child, file));
					if (!_.isEmpty(ret) && !options.recursive) break;
				}
			}
		}
	}
	return ret;
};

const update = (commander) => {
	options = commander;

	// Build lists of promises for npm:
	let npmPromises = [];
	if (options.npm) {
		let npmLocations = find(process.cwd(), "package.json", true);
		if (!_.isEmpty(npmLocations)) _.forEach(npmLocations, (location) => npmPromises.push(build(location, "npm", colors.magenta)));
		else console.log("No package.json found, skipping npm calls.".yellow);
	}

	// Build lists of promises for bower:
	let bowerPromises = [];
	if (options.bower) {
		let bowerLocations = find(process.cwd(), "bower.json");
		if (!_.isEmpty(bowerLocations)) _.forEach(bowerLocations, (location) => bowerPromises.push(build(location, "bower", colors.blue)));
		else console.log("No bower.json found, skipping bower calls.".yellow);
	}

	// Parallel processing:
	if (options.parallel) {
		let parameters = params();

		// Buffered output for parallel processing:
		if (options.buffered) {
			console.log("Running all npm calls...".magenta);
			exec("updatejs -n" + parameters, (error, stdout) => console.log(stdout.magenta));

			console.log("Running all bower calls...".blue);
			exec("updatejs -b" + parameters, (error, stdout) => console.log(stdout.blue));

			// Real time, non-buffered output for parallel processing:
		} else {
			let npmChild = exec("updatejs -n" + parameters);
			npmChild.stdout.on("data", (data) => {
				if (data.indexOf("For") >= 0) console.log(data.red);
				else if (data.indexOf("Done") >= 0) console.log(data.green);
				else console.log(data.magenta);
			});

			let bowerChild = exec("updatejs -b" + parameters);
			bowerChild.stdout.on("data", (data) => {
				if (data.indexOf("For") >= 0) console.log(data.red);
				else if (data.indexOf("Done") >= 0) console.log(data.green);
				else console.log(data.blue);
			});
		}
	}

	// Sequential processing:
	else {
		let promises = _.concat(npmPromises, bowerPromises);
		seq(promises).then(() => console.log("Done.".green));
	}
};

module.exports = {update};
