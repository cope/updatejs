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

var fs = require('fs');
var cmd = require('node-cmd');
var colors = require('colors');
var program = require('commander');

program
	.version('0.0.3')
	.option('', '')
	.option('-n, --npm', 'Perform *only* npm install/update/prune calls', false)
	.option('-b, --bower', 'Perform *only* bower install/update/prune calls', false)
	.option('', '')
	.option('-r, --recursive', 'Perform bower install/update/prune calls recursively')
	.option('', 'Does not work with the -n option')
	.option('', '')
	.option('-nb, <no params>', 'Perform both npm and bower install/update/prune calls')
	.parse(process.argv)
;

// If just `update` is executed, run npm and bower
if (!program.npm && !program.bower) {
	program.npm = true;
	program.bower = true;
}

var update = {
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
		var files = fs.readdirSync(path);
		var file, id, x = 0, newName;
		for (id in files) {
			if (files.hasOwnProperty(id)) {
				file = files[id];
				if (fs.lstatSync(path + "/" + file).isDirectory() && this.isValidFolder(file)) {
					if (this.checkBower(path + "/" + file)) {
						this.bowerLocation = path + "/" + file;
					} else {
						!this.bowerLocation && this.findBower(path + "/" + file);
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

			console.log('Running bower install...'.blue);
			cmd.get('bower install', function (bowerInstallResponse) {
				bowerInstallResponse && bowerInstallResponse.length > 0 && console.log(bowerInstallResponse);

				console.log('Running bower update...'.blue);
				cmd.get('bower update', function (bowerUpdateResponse) {
					bowerUpdateResponse && bowerUpdateResponse.length > 0 && console.log(bowerUpdateResponse);

					console.log('Running bower prune...'.blue);
					cmd.get('bower prune', function (bowerPruneResponse) {
						bowerPruneResponse && bowerPruneResponse.length > 0 && console.log(bowerPruneResponse);
						console.log('Done.'.green);
					});
				});
			});

		} else {
			console.log("\nNo bower.json found, skipping bower calls.\n".underline.yellow);
			console.log('Done.'.green);
		}
	},
	all: function () {
		this.checkNPM();

		if (!program.npm && program.bower) {
			this.bower();

		} else {
			var self = this;

			if (true === this.hasPackageJSON) {
				console.log('Running npm install...'.magenta);
				cmd.get('npm install', function (npmInstallResponse) {
					npmInstallResponse && npmInstallResponse.length > 0 && console.log(npmInstallResponse);

					console.log('Running npm update...'.magenta);
					cmd.get('npm update', function (npmUpdateResponse) {
						npmUpdateResponse && npmUpdateResponse.length > 0 && console.log(npmUpdateResponse);

						console.log('Running npm prune...'.magenta);
						cmd.get('npm prune', function (npmPruneResponse) {
							npmPruneResponse && npmPruneResponse.length > 0 && console.log(npmPruneResponse);

							if (program.bower) {
								self.bower();
							} else {
								console.log('Done.'.green);
							}
						});
					});
				});

			} else {
				console.log("No package.json found, skipping npm calls.\n".underline.yellow);
				if (program.bower) {
					self.bower();
				} else {
					console.log('Done.'.green);
				}
			}
		}
	}
};

update.all();
