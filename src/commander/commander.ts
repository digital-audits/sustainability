import {Page} from 'puppeteer';
import {DEFAULT} from '../settings/settings';
import path = require('path');
import fs = require('fs');
import {Tracker, PageContext} from '../types';
import * as util from '../utils/utils';
import {ConnectionSettingsPrivate, ConnectionSettings} from '../types/settings';

const debug = util.debugGenerator('Commander');

class Commander {
	private settings = {} as ConnectionSettingsPrivate;
	private readonly audits = DEFAULT.AUDITS;
	private tracker = {} as Tracker;

	async setUp(
		pageContext: PageContext,
		settings?: ConnectionSettings
	): Promise<Page> {
		try {
			debug('Running set up');
			const {page, url} = pageContext;
			this.settings = settings
				? {...DEFAULT.CONNECTION_SETTINGS, ...settings}
				: DEFAULT.CONNECTION_SETTINGS;
			this.tracker = util.createTracker(page);

			// Page.setJavaScriptEnabled(false); Speeds up process drastically
			const pageFeaturesArray = [
				page.setViewport(this.settings.emulatedDevice.viewport),
				page.setUserAgent(this.settings.emulatedDevice.userAgent),
				page.browserContext().overridePermissions(url, ['geolocation']),
				page.setGeolocation({
					latitude: this.settings.location.latitude,
					longitude: this.settings.location.longitude,
					accuracy: this.settings.location.accuracy
				}),
				page.setCacheEnabled(false),
				page.setBypassCSP(true),
				page.setJavaScriptEnabled(true),
				page.setRequestInterception(false),
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
			];
			await Promise.all(pageFeaturesArray);

			return page;
		} catch (error) {
			throw new Error(`Setup error ${error.message}`);
		}
	}

	async asyncEvaluate(pageContext: PageContext): Promise<Array<Promise<any>>> {
		try {
			debug('Runnining collectors');
			// @ts-ignore
			const traces = await Promise.allSettled(
				this.audits.collectors.map((collect: any) =>
					collect.collect(pageContext, this.settings)
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
			throw new Error(`Error: Commander failed with ${error.message}`);
		}
	}
}

export default new Commander();
