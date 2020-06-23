import {Page} from 'puppeteer';
import {DEFAULT} from '../settings/settings';
import path = require('path');
import fs = require('fs');
import {createTracker, safeReject} from '../helpers/safeReject';
import {Collect} from '../collect/collect'
import {Tracker, PageContext} from '../types/cluster-settings';
import { debugGenerator, log } from '../utils/utils';

const debug = debugGenerator('Commander')

export class Commander {
	private settings = DEFAULT.CONNECTION_SETTINGS;
	private readonly audits = DEFAULT.AUDITS;
	private tracker = {} as Tracker;

	async setUp(
		pageContext: PageContext,
		settings?: SA.Settings.ConnectionSettings
	): Promise<Page> {
		try {
			debug('Running set up')
			const {page, url} = pageContext;
			if (settings) {
				this.settings = settings;
			}

			this.tracker = createTracker(page);


			// Page.setJavaScriptEnabled(false); Speeds up process drastically

			await Promise.all([
				page.setViewport({
					width: this.settings.emulatedDevices[0].viewport.width,
					height: this.settings.emulatedDevices[0].viewport.height
				}),
				page.setUserAgent(this.settings.emulatedDevices[0].userAgent),
				page.browserContext().overridePermissions(url, ['geolocation']),
				page.setGeolocation({
					latitude: this.settings.locations[1].latitude,
					longitude: this.settings.locations[1].longitude,
					accuracy: this.settings.locations[1].accuracy
				}),
				page.setCacheEnabled(false),
				page.setBypassCSP(true),
				//Glyphhanger dependency
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
			log(`Setup error ${error.message}`);
			process.exit(1)
		}
	}

	async navigate(pageContext:PageContext) {
		try {
			const {page, url} = pageContext
			debug(`Starting navigation to ${url}`)
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
				() => stopCallback(debug('Forced end of navigation because the URL surpassed the maxNavigationTime')),
				DEFAULT.CONNECTION_SETTINGS.maxNavigationTime
			);
			await Promise.race([navigateAndClearTimeout(), stopPromise]);
			page.removeAllListeners('requestfinished');
			page.removeAllListeners('response');
			debug('Done navigation')
		} catch (error) {
			safeReject(error, this.tracker);
			process.exit(1)
		}
	}

	async asyncEvaluate(pageContext:PageContext): Promise<Array<Promise<any>>> {
		try {
		debug('Runnining collectors')
		const collectMap = new Map(this.audits.collectors.map((col:any)=>[col.id,col.collect(pageContext)]))
		// @ts-ignore
		return Promise.allSettled(
			this.audits.audits.map(async (audit:any) => {
				const applicableCollects = audit.meta.collectors
				//@ts-ignore
				const trace = await Promise.allSettled(applicableCollects.map((ap:any)=>{
					return collectMap.get(ap)
				}))
				debug(`done collector/s ${[...applicableCollects]} now parsing the traces`)
				const parsed = Collect.parseAllSettled(trace)
				debug(`running audit ${audit.meta.id}`)
				return audit.audit(parsed)
			})
		);
		} catch (error) {
			log(`Error: Commander returned ${error.message}`)
			return new Promise((resolve,_)=>resolve(undefined))
		}
	}

}


/**
 * try {
		debug('Runnining collectors')
			// @ts-ignore
		const traces = await Promise.allSettled(
			this.audits.collectors.map(collect => collect(pageContext))
		);
		debug('Finished collectors now parsing the traces')
		const parsedTraces = Collect.parseAllSettled(traces);
		debug('Running audits')
		// @ts-ignore
		return Promise.allSettled(
			this.audits.audits.map(audit => audit(parsedTraces))
		);
		} catch (error) {
			log(`Error: Commander returned ${error.message}`)
			return new Promise((resolve,_)=>resolve(undefined))
		}
	}
 */