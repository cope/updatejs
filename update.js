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
		console.log('Running bower install...');
		cmd.get('bower install', function (bowerInstallResponse) {
			bowerInstallResponse && bowerInstallResponse.length > 0 && console.log(bowerInstallResponse);

			console.log('Running bower update...');
			cmd.get('bower update', function (bowerUpdateResponse) {
				bowerUpdateResponse && bowerUpdateResponse.length > 0 && console.log(bowerUpdateResponse);

				console.log('Running bower prune...');
				cmd.get('bower prune', function (bowerPruneResponse) {
					bowerPruneResponse && bowerPruneResponse.length > 0 && console.log(bowerPruneResponse);
					console.log('Done.');
				});
			});
		});
	},
	all: function () {
		if (!program.npm && program.bower) {
			this.bower();

		} else {
			var self = this;

			console.log('Running npm install...');
			cmd.get('npm install', function (npmInstallResponse) {
				npmInstallResponse && npmInstallResponse.length > 0 && console.log(npmInstallResponse);

				console.log('Running npm update...');
				cmd.get('npm update', function (npmUpdateResponse) {
					npmUpdateResponse && npmUpdateResponse.length > 0 && console.log(npmUpdateResponse);

					console.log('Running npm prune...');
					cmd.get('npm prune', function (npmPruneResponse) {
						npmPruneResponse && npmPruneResponse.length > 0 && console.log(npmPruneResponse);

						if (program.bower) {
							self.bower();
						} else {
							console.log('Done.');
						}
					});
				});
			});
		}
	}
};

update.all();
