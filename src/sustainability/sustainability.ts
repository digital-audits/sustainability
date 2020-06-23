import Connection from '../connection/connection';
import {Commander} from '../commander/commander';
import {generate} from '../helpers/uuid-generator';
import {Collect} from '../collect/collect';
import {Audit} from '../audits/audit';
import {PageContext } from '../types/cluster-settings';
import { log } from '../utils/utils';
import { Page, LaunchOptions, Browser } from 'puppeteer';


interface AuditSettings {
	id?:string
	page?:Page
	launchSettings?:LaunchOptions
	connectionSettings?:SA.Settings.ConnectionSettings
	
}
export default class Sustainability  {
	
	private browser = {} as Browser

	async audit(url:string, options?:AuditSettings){
		let page:Page
		try{
		if(!options?.page){
			const output = await this.startNewConnectionAndReturnPage()
			page = output.page
			this.browser = output.browser
		}else{
			page=options.page
		}
		const pageContext = {page,url}
		const results = await this.handler(pageContext)

		console.log(JSON.stringify(results))
		}
		catch(error){
			log(`Error: Audit failed with message: ${error.message}`)
		}finally{
			await this.browser.close()
		}

	}

	async startNewConnectionAndReturnPage(){
		const connection = new Connection()
		const browser = await connection.setUp()
		const page = await browser.newPage()

		return {page,browser}
	}

	async handler(pageContextRaw: PageContext) {
		const startTime = Date.now();
		const commander = new Commander();

		const projectId = generate();
		const {url} = pageContextRaw;
		const _page = await commander.setUp(pageContextRaw);
		const pageContext = {...pageContextRaw, page: _page};

		// @ts-ignore allSettled lacks typescript support
		const results = await Promise.allSettled([
			commander.navigate(pageContext),
			commander.asyncEvaluate(pageContext)
		]);

		const resultsParsed = Collect.parseAllSettled(results, true);
		const audits = Audit.groupAudits(resultsParsed);
		const globalScore = Audit.computeScore(audits);

		const meta = {
			id: projectId,
			url,
			timing: [startTime, Date.now()]
		};
		return {
			globalScore,
			meta,
			audits
		};
	}
}
