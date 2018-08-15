#!/usr/bin/env node

"use strict";

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

var commander = require("commander");

commander
	.version("0.3.2")
	.option("", "")
	.option("-n, --npm", "Perform *only* npm calls", false)
	.option("-b, --bower", "Perform *only* bower calls", false)
	.option("", "")
	.option("-i, --install", "Perform *only* install calls", false)
	.option("-u, --update", "Perform *only* update calls", false)
	.option("-p, --prune", "Perform *only* prune calls", false)
	.option("", "")
	.option("-r, --recursive", "Perform calls recursively in all subfolders", false)
	.option("", "WARNING: The more projects you have, the longer it will take.")
	.option("", "")
	.option("-P, --parallel", "Perform npm and bower calls in parallel, not consecutively", false)
	.option("", "WARNING: The output will happen in real time, all mixed up.")
	.option("-f, --buffered", "Buffered output for the parallel execution", false)
	.option("", "WARNING: The output will happen only at the end:")
	.option("", "- once for all npm calls, and once for all bower calls.")
	.option("", "")
	.option("<no params>", "Same as using -nbiup:")
	.option("", "Performs all npm and bower install/update/prune calls in local project")
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
if (!commander.npm && !commander.bower) commander.npm = commander.bower = true;

if (!commander.install && !commander.update && !commander.prune) commander.install = commander.update = commander.prune = true;

if (commander.parallel && (commander.npm !== commander.bower)) {
	console.log(("Ignoring -P (--parallel) because you only selected " + (commander.npm ? "npm" : "bower") + ".").red);
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

var updatejs = require("./lib/updatejs");
updatejs.update(commander);
