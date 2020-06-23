import Connection from '../connection/connection';
import {Commander} from '../commander/commander';
import {generate} from '../helpers/uuid-generator';
import {Collect} from '../collect/collect';
import {Audit} from '../audits/audit';
import {PageContext } from '../types/cluster-settings';
import { log } from '../utils/utils';
import { LaunchOptions, Browser } from 'puppeteer';
import {AuditSettings} from '../types/cluster-settings'



export default class Sustainability  {

	async audit(url:string, options?:AuditSettings){
		const browser = options?.browser || await this.startNewConnectionAndReturnBrowser()
		try {
			const page = await browser.newPage()
			try{
				const pageContext = {page,url}
				const results = await this.handler(pageContext)

				return results
			}
			catch(error){
				log(`Error: Audit failed with message: ${error.message}`)
				process.exit(1)
			}finally{
				await page.close()
			}
		} catch (error) {
			log(`Error: Failed to launch page`)
			process.exit(1)
		} finally{
			await browser.close()
		}
	}

	async startNewConnectionAndReturnBrowser():Promise<Browser>{
		const connection = new Connection()
		const browser = await connection.setUp()

		return browser
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
