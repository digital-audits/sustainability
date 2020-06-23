/**
 * Configuration for the connection
 * Override default config options by calling it with your options.
 * Note the most of those options are related to Puppeteer Cluster options, but
 * also to @Cx.Options
 */
import {DEFAULT} from '../settings/settings';
import puppeter = require('puppeteer')
import { debugGenerator, log } from '../utils/utils';

const debug = debugGenerator('Connection')

export default class Connection {
	private settings = DEFAULT

	async setUp(settings?: SA.Settings.DefaultSettings): Promise<puppeter.Browser> {

			if (settings) {
				this.settings = settings;
			}

			if(process.env.CHROME_BIN){
				this.settings.LAUNCH_SETTINGS.executablePath = process.env.CHROME_BIN
			}
			debug('Launching browser')
			const browser = await puppeter.launch(this.settings.LAUNCH_SETTINGS)
			return browser
		
	}
}
