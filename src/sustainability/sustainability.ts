
import Connection from '../connection/connection';
import Commander from '../commander/commander';
import {PageContext } from '../types/index';
import { log } from '../utils/utils';
import { LaunchOptions, Browser } from 'puppeteer';
import {AuditSettings} from '../types/index'
import * as util from '../utils/utils'

export default class Sustainability  {

	public static async audit(url:string, options?:AuditSettings){

		const sustainability = new Sustainability()
		const browser = options?.browser || await sustainability.startNewConnectionAndReturnBrowser(options?.launchSettings)
		try {
			const page = options?.page || await browser.newPage()

			try{
				const pageContext = {page, url}
				const report = await sustainability.handler(pageContext, options)
				return report
			}
			catch(error){
				log(`Error: Audit failed with message: ${error.message}`)
				process.exit(1)
			}finally{
				await page.close()
			}
		} catch (error) {
			log(`Error: Failed to launch page: ${error.message}`)
			process.exit(1)
		} finally{
			await browser.close()
		}
	}

	private async startNewConnectionAndReturnBrowser(options?:LaunchOptions):Promise<Browser>{
		const browser = await Connection.setUp(options)
		return browser
	}

	private async handler(pageContextRaw: PageContext, options?:AuditSettings) {
		const startTime = Date.now();

		const projectId = options?.id || util.generate()
		const {url} = pageContextRaw;
		const page = await Commander.setUp(pageContextRaw, options?.connectionSettings);

		const pageContext = {...pageContextRaw, page};

		// @ts-ignore allSettled lacks typescript support
		const results = await Promise.allSettled([
			Commander.navigate(pageContext),
			Commander.asyncEvaluate(pageContext)
		]);

		const resultsParsed = util.parseAllSettled(results, true);
		const audits = util.groupAudits(resultsParsed);
		const globalScore = util.computeScore(audits);

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
