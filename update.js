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

var cmd = require('node-cmd');
var program = require('commander');

program
.version('0.0.1')
.option('', '')
.option('-n, --npm', 'Perform *only* npm install/update/prune calls')
.option('-b, --bower', 'Perform *only* bower install/update/prune calls')
.option('', '')
.option('-nb, <no params>', 'Perform both npm and bower install/update/prune calls')
.parse(process.argv);

program.npm = program.npm || false;
program.bower = program.bower || false;

if (!program.npm && !program.bower) {
	program.npm = true;
	program.bower = true;
}

var update = {
	bower: function () {
		console.log('bower install');
		cmd.get('bower install', function (bowerInstallResponse) {
			console.log(bowerInstallResponse);

			console.log('bower update');
			cmd.get('bower update', function (bowerUpdateResponse) {
				console.log(bowerUpdateResponse);

				console.log('bower prune');
				cmd.get('bower prune', function (bowerPruneResponse) {
					console.log(bowerPruneResponse);
				});
			});
		});
	},
	all: function () {
		if (!program.npm && program.bower) {
			this.bower();

		} else {
			var self = this;

			console.log('npm install');
			cmd.get('npm install', function (npmInstallResponse) {
				console.log(npmInstallResponse);

				console.log('npm update');
				cmd.get('npm update', function (npmUpdateResponse) {
					console.log(npmUpdateResponse);

					console.log('npm prune');
					cmd.get('npm prune', function (npmPruneResponse) {
						console.log(npmPruneResponse);

						program.bower && self.bower();
					});
				});
			});
		}
	}
};

update.all();
