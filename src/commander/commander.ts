import {LoadEvent, Page} from 'puppeteer';
import {DEFAULT} from '../settings/settings';
import path = require('path');
import fs = require('fs');
import {Tracker, PageContext} from '../types';
import * as util from '../utils/utils';
import {ConnectionSettingsPrivate, ConnectionSettings} from '../types/settings';
import Audit from '../audits/audit';
import { PassContext } from '../types/audit';
import Collect from '../collect/collect';
import { Traces } from '../types/traces';
import { reportStream } from '../sustainability/stream';

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
			debug('Async evaluate')
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

	async dynamicEvaluate(pageContext: PageContext){
		debug('Dynamic evaluate')
		debug('Scheduling collectors')
		const runAuditsMap = new Map<string, any[]>()
		const {page} = pageContext

		const getCollector = (collectId:string) => 
		this.audits.collectors.filter((collect:any)=>
			collect.meta.id === collectId)

		const getAudit = (auditId:string)=>
		this.audits.audits.filter((audit:any)=>audit.meta.id === auditId)



		this.audits.audits.forEach((audit:any)=>{
			const auditCollectorsIds = audit.meta.collectors
			auditCollectorsIds.forEach((collectorId:string)=>{
					const collectorsArray = runAuditsMap.get(audit.meta.id)
					const collectorInstance = getCollector(collectorId)
					
					if(collectorsArray){
						runAuditsMap.set(audit.meta.id, [...collectorsArray, collectorInstance])
					}else{
						runAuditsMap.set(audit.meta.id, [collectorInstance])
					}
			})
		})

		const schedulerArray = [...runAuditsMap.entries()]
		const alreadyInstancedCollects = new Set()
		let globalTraces = {} as Traces

		//@ts-ignore
		return Promise.allSettled(
			schedulerArray.map(async scheduled=>{
				//@ts-ignore
				const collectInstances = scheduled[1].flat()
				const auditInstance = getAudit(scheduled[0])[0]
				const filteredCollectInstances = collectInstances.filter((collect:any)=>{
					if(!alreadyInstancedCollects.has(collect.meta.id)){
						alreadyInstancedCollects.add(collect.meta.id)
						debug(`Updated collect queue ${[...alreadyInstancedCollects.values()]}`)
						return true
					}
					return false
				})


			if(filteredCollectInstances.length){
				//todo implement passcontext cycle
				//@ts-ignore
				const traces = await Promise.allSettled([
				...collectInstances.map((c:any)=>c.collect(pageContext, this.settings))
				])
				const parsedTraces = util.parseAllSettled(traces)
				globalTraces = {...globalTraces, ...parsedTraces}
				collectInstances.forEach((collect:any)=>page.emit(collect.meta.id))
			}else{
				await Promise.all([
					collectInstances.map((collect:any)=>{
						return new Promise((resolve)=>{
							debug(`Waiting for ${collect.meta.id} to resolve`)
							page.on(collect.meta.id, resolve)
						})
					})
				])
			}
			const auditResult = await auditInstance.audit(globalTraces)
			debug(`Streaming ${auditInstance.meta.id}`)
			reportStream.push(JSON.stringify(auditResult))
			return auditResult
		})
		)	
	}


	async loadEventContext(loadEvent:LoadEvent, collect:any, pageContext:PageContext){
		const {page} = pageContext
		const debug = collect.debug
		return util.safeNavigateTimeout(page, loadEvent, this.settings.maxNavigationTime, debug)
	}

	async selectorContext(selector:string, pageContext:PageContext){

	}

}

export default new Commander();
