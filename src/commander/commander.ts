import {LoadEvent, Page} from 'puppeteer';
import {DEFAULT} from '../settings/settings';
import path = require('path');
import fs = require('fs');
import {Tracker, PageContext} from '../types';
import * as util from '../utils/utils';
import {ConnectionSettingsPrivate, ConnectionSettings} from '../types/settings';
import Audit from '../audits/audit';
import {CollectorsIds, PassContext} from '../types/audit';
import Collect from '../collect/collect';
import {Traces} from '../types/traces';
import {auditStream} from '../sustainability/stream';
import {once, EventEmitter} from 'events';

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

	async evaluate(pageContext: PageContext): Promise<Array<Promise<any>>> {
		if (this.settings.streams) return this.dynamicEvaluate(pageContext);

		return this.staticEvaluate(pageContext);
	}

	async staticEvaluate(pageContext: PageContext): Promise<Array<Promise<any>>> {
		try {
			debug('Static evaluate');
			debug('Runnining collectors');
			// @ts-ignore
			const traces = await Promise.allSettled(
				this.audits.collectors.map(collect =>
					collect.collect(pageContext, this.settings)
				)
			);
			debug('Finished collectors now parsing the traces');
			const parsedTraces = util.parseAllSettled(traces);
			debug('Running audits');
			// @ts-ignore
			return Promise.allSettled(
				this.audits.audits.map(audit => audit.audit(parsedTraces))
			);
		} catch (error) {
			throw new Error(`Error: Commander failed with ${error.message}`);
		}
	}

	async dynamicEvaluate(
		pageContext: PageContext
	): Promise<Array<Promise<any>>> {
		debug('Dynamic evaluate');
		debug('Scheduling collectors');
		const runAuditsMap = new Map<string, Array<typeof Collect>>();

		const getCollector = (collectId: string) =>
			this.audits.collectors.filter(collect => collect.meta.id === collectId);
		const getAudit = (auditId: string) =>
			this.audits.audits.filter(audit => audit.meta.id === auditId);

		this.audits.audits.forEach(audit => {
			const auditCollectorsIds = audit.meta.collectors;
			auditCollectorsIds.forEach((collectorId: string) => {
				const collectorsArray = runAuditsMap.get(audit.meta.id);
				const collectorInstance = getCollector(collectorId);
				if (collectorsArray) {
					runAuditsMap.set(audit.meta.id, [
						...collectorsArray,
						...collectorInstance
					]);
				} else {
					runAuditsMap.set(audit.meta.id, collectorInstance);
				}
			});
		});
		const schedulerArray = [...runAuditsMap.entries()];
		const alreadyInstancedCollects = new Set<CollectorsIds>();
		let globalTraces = {} as Traces;
		const globalEventEmitter = new EventEmitter();
		globalEventEmitter.setMaxListeners(20);
		// @ts-ignore
		return Promise.allSettled(
			schedulerArray.map(async scheduled => {
				const collectInstances = scheduled[1];
				const auditInstance = getAudit(scheduled[0])[0];
				const filteredCollectInstances = collectInstances.filter(collect => {
					if (!alreadyInstancedCollects.has(collect.meta.id)) {
						alreadyInstancedCollects.add(collect.meta.id);
						debug(
							`Updated collect queue ${[...alreadyInstancedCollects.values()]}`
						);
						return true;
					}

					return false;
				});
				if (filteredCollectInstances.length) {
					// @ts-ignore
					const traces = await Promise.allSettled([
						...collectInstances.map(c => c.collect(pageContext, this.settings))
					]);
					debug('parsing traces');
					const parsedTraces = util.parseAllSettled(traces);
					globalTraces = {...globalTraces, ...parsedTraces};
					collectInstances.forEach(collect =>
						globalEventEmitter.emit(collect.meta.id)
					);
				} else {
					const promiseArray = collectInstances.map(collect => {
						debug(
							`${auditInstance.meta.id} is waiting for ${collect.meta.id} to resolve`
						);
						return once(globalEventEmitter, collect.meta.id);
					});
					await Promise.all(promiseArray);
				}

				const auditResult = await auditInstance.audit(globalTraces);
				debug(`Streaming ${auditInstance.meta.id} audit`);
				auditStream.push(JSON.stringify(auditResult));

				return auditResult;
			})
		);
	}
}

export default new Commander();
