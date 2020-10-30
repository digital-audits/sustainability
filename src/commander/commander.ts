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
import { auditStream } from '../sustainability/stream';
import {once, EventEmitter} from 'events'

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

	async evaluate(pageContext:PageContext):Promise<Array<Promise<any>>>{
		if(this.settings.streams)
		return this.dynamicEvaluate(pageContext)
		
		return this.staticEvaluate(pageContext)

	}

	async staticEvaluate(pageContext: PageContext): Promise<Array<Promise<any>>> {
		try {
			debug('Static evaluate')
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

	async dynamicEvaluate(pageContext: PageContext):Promise<Array<Promise<any>>>{
		debug('Dynamic evaluate')
		debug('Scheduling collectors')
		const runAuditsMap = new Map<string, any[]>()
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
		const globalEventEmitter = new EventEmitter()
		globalEventEmitter.setMaxListeners(20)
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
				//@ts-ignore
				const traces = await Promise.allSettled([
				...collectInstances.map((c:any)=>c.collect(pageContext, this.settings))
				])
				debug('parsing traces')
				const parsedTraces = util.parseAllSettled(traces)
				globalTraces = {...globalTraces, ...parsedTraces}
				collectInstances.forEach((collect:any)=>globalEventEmitter.emit(collect.meta.id))
			}else{
				const promiseArr = collectInstances.map((collect:any)=>{
					debug(`${auditInstance.meta.id} is waiting for ${collect.meta.id} to resolve`)
					return once(globalEventEmitter, collect.meta.id)
				})
				await Promise.all(promiseArr)
			}
			const auditResult = await auditInstance.audit(globalTraces)
			debug(`Streaming ${auditInstance.meta.id} audit`)
			auditStream.push(JSON.stringify(auditResult))
			
			return auditResult
		})
		)	
	}
}

export default new Commander();
