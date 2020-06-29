import {Page} from 'puppeteer';
import {DEFAULT} from '../settings/settings';
import path = require('path');
import fs = require('fs');
import {Tracker, PageContext} from '../types';
import * as util from '../utils/utils';

const debug = util.debugGenerator('Commander');

class Commander {
	private settings = {} as SA.Settings.ConnectionSettingsPrivate;
	private readonly audits = DEFAULT.AUDITS;
	private tracker = {} as Tracker;

	async setUp(
		pageContext: PageContext,
		settings?: SA.Settings.ConnectionSettings
	): Promise<Page> {
		try {
			debug('Running set up');
			const {page, url} = pageContext;
			this.settings = settings
				? {...DEFAULT.CONNECTION_SETTINGS, ...settings}
				: DEFAULT.CONNECTION_SETTINGS;

			this.tracker = util.createTracker(page);

			// Page.setJavaScriptEnabled(false); Speeds up process drastically

			await Promise.all([
				page.setViewport({
					width: this.settings.emulatedDevice.viewport.width,
					height: this.settings.emulatedDevice.viewport.height
				}),
				page.setUserAgent(this.settings.emulatedDevice.userAgent),
				page.browserContext().overridePermissions(url, ['geolocation']),
				page.setGeolocation({
					latitude: this.settings.location.latitude,
					longitude: this.settings.location.longitude,
					accuracy: this.settings.location.accuracy
				}),
				page.setCacheEnabled(false),
				page.setBypassCSP(true),
				// Glyphhanger dependency
				page.evaluateOnNewDocument(
					fs.readFileSync(require.resolve('characterset'), 'utf8')
				),
				page.setDefaultNavigationTimeout(0),
				page.evaluateOnNewDocument(
					fs.readFileSync(
						path.resolve(__dirname, '../bin/glyphhanger-script.js'),
						'utf8'
					)
				)
			]);

			return page;
		} catch (error) {
			util.log(`Setup error ${error.message}`);
			process.exit(1);
		}
	}

	async navigate(pageContext: PageContext) {
		try {
			const {page, url} = pageContext;
			debug(`Starting navigation to ${url}`);
			let stopCallback: any = null;
			const stopPromise = new Promise(x => (stopCallback = x));
			const navigateAndClearTimeout = async () => {
				await page.goto(url, {
					waitUntil: 'networkidle0',
					timeout: 0
				});
				clearTimeout(stopNavigation);
			};

			const stopNavigation = setTimeout(
				() =>
					stopCallback(
						debug(
							'Forced end of navigation because the URL surpassed the maxNavigationTime'
						)
					),
				DEFAULT.CONNECTION_SETTINGS.maxNavigationTime
			);
			await Promise.race([navigateAndClearTimeout(), stopPromise]);
			page.removeAllListeners('requestfinished');
			page.removeAllListeners('response');
			debug('Done navigation');
		} catch (error) {
			util.safeReject(error, this.tracker);
		}
	}

	async asyncEvaluate(pageContext: PageContext): Promise<Array<Promise<any>>> {
		try {
			debug('Runnining collectors');
			// @ts-ignore
			const traces = await Promise.allSettled(
				this.audits.collectors.map((collect: any) =>
					collect.collect(pageContext)
				)
			);
			debug('Finished collectors now parsing the traces');
			const parsedTraces = util.parseAllSettled(traces);
			debug('Running audits');
			// @ts-ignore
			return Promise.allSettled(
				this.audits.audits.map((audit: any) => audit.audit(parsedTraces))
			);
		} catch (error) {
			util.log(`Error: Commander failed with ${error.message}`);
			return await new Promise((resolve, _) => resolve(undefined));
		}
	}
}

export default new Commander();
