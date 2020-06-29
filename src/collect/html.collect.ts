import Collect from './collect';
import { PageContext } from '../types/index'
import * as util from '../utils/utils'

const debug = util.debugGenerator('Console Collect')
export default class CollectHTML extends Collect {
	collectId:SA.Audit.CollectorsIds='htmlcollect'
	static get id(){
		return this.collectId
	}
	static async collect(pageContext: PageContext): Promise<SA.Traces.CollectHtmlTraces| undefined> {
		try {
			debug('running')
			const {page} = pageContext;
			const result:string[] = [];

			await page.waitForSelector('body');
			const javascriptHtml = await page.evaluate(
				() => document.querySelector('*')!.outerHTML
			);
			const vanillaHtml = await page.content();

			result.push(vanillaHtml === javascriptHtml ? javascriptHtml: javascriptHtml, vanillaHtml)
			debug('done')
			return {
				html: result
			};
		} catch (error) {
			util.log(`Error:Console collect failed with message: ${error.message}`)
			return undefined
		}
	}
}
