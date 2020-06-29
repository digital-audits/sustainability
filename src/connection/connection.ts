/**
 * Configuration for the connection
 * Override default config options by calling it with your options.
 */
import {DEFAULT} from '../settings/settings';
import {LaunchOptions, Browser, launch as puppeteerLaunch} from 'puppeteer';

import * as util from '../utils/utils';

const debug = util.debugGenerator('Connection');

class Connection {
	private launchSettings = {} as LaunchOptions;

	async setUp(launchSettings?: LaunchOptions): Promise<Browser> {
		this.launchSettings = launchSettings ?? DEFAULT.LAUNCH_SETTINGS;

		if (process.env.CHROME_BIN) {
			this.launchSettings.executablePath = process.env.CHROME_BIN;
		}

		debug('Launching browser');
		const browser = await puppeteerLaunch(this.launchSettings);
		return browser;
	}
}

export default new Connection();
