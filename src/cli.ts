#!/usr/bin/env node

import * as minimist from 'minimist';
import * as Debug from 'debug';
import {Sustainability} from '.';
import {AuditSettings} from './types';
import * as fs from 'fs';
import * as util from './utils/utils';
const version: string = require('../package.json').version;
const name: string = require('../package.json').name;

const debug = util.debugGenerator('CLI');

const args = process.argv.slice(2);
const argv = minimist(args, {
	boolean: ['help', 'version', 'nosandbox', 'debug'],
	string: ['output', 'viewport', 'maxnav'],
	alias: {
		help: 'h',
		version: 'v',
		output: 'o',
		debug: 'd'
	},
	unknown: parameter => {
		if (parameter.startsWith('-')) {
			console.warn('Ignored unknown option: ' + parameter + '\n');
			return false;
		}

		return true;
	}
});

if (argv.version) {
	console.log(version);
	process.exit(0);
}

if (argv.debug) {
	Debug.enable('sustainability:*');
}

if (argv.help) {
	console.log(`
    Usage: ${name} [opts] url
    Available options:

    --output <path> or -o <path>  Path to write the audit report
    --viewport                    Determines page viewport. Values are ’mobile’ or ’desktop’. Defaults to desktop
    --maxnav                      Max puppeteer navigation time in ms. Defaults to 60000 (60s) and should be greater than 15000 (15s)
    --nosandbox                   Launches puppeteer with [’--no-sandbox’, ’--disable-setuid-sandbox’]
    --debug or -d                 Enables verbose logging.
    --version or -v               Prints out ${name} version
    `);
	process.exit(0);
}

const parsedMaxNav = (time: string) => {
	if (Number(time) >= 15000) {
		debug(`Set maxnav to ${time}`);
		return Number(time);
	}

	console.error(`Invalid maxnav value ${time} ms`);
	process.exit(1);
};

const url = argv._[0];

if (argv.viewport && argv.viewport === 'mobile') {
	debug('Set mobile device');
}

if (argv.nosandbox) {
	debug('Set nosandbox opt in puppeteer launch');
}

try {
	new URL(url);
} catch (error) {
	console.error(
		`${url} is not a valid URL. Make sure to include the scheme (i.e http/https)`
	);
	process.exit(1);
}

const options: AuditSettings = {
	...(argv.nosandbox
		? {
				launchSettings: {
					args: ['--no-sandbox', '--disable-setuid-sandbox']
				}
		  }
		: {}),
	...(argv.viewport || argv.maxnav
		? {
				connectionSettings: {
					...(argv.viewport === 'mobile'
						? {
								emulatedDevice: {
									name: 'mobile',
									userAgent:
										'Mozilla/5.0 (Linux; Android 7.0; SM-G930V Build/NRD90M) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/59.0.3071.125 Mobile Safari/537.36',
									viewport: {
										width: 360,
										height: 640
									}
								}
						  }
						: {}),
					...(argv.maxnav
						? {
								maxNavigationTime: parsedMaxNav(argv.maxnav)
						  }
						: {})
				}
		  }
		: {})
};

Sustainability.audit(url, Object.keys(options).length ? options : {})
	.then(report => {
		if (argv.output) {
			const filename = argv.output;
			debug(`Writing file to ${filename}`);
			try {
				fs.writeFileSync(
					filename,
					JSON.stringify(report, null, 2) + '\n',
					'utf8'
				);
				console.log(
					`Success. Kindly find the latest sustainability report at ${filename}.`
				);
			} catch (err) {
				console.error('Unable to write file: ' + filename + '\n' + err);
				process.exit(2);
			}
		} else {
			console.log(JSON.stringify(report, null, 2));
		}
	})
	.catch(error => {
		console.error(error);
		process.exit(3);
	});
