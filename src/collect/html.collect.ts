import Collect from './collect';
import {PageContext} from '../types';
import * as util from '../utils/utils';
import {CollectorsIds} from '../types/audit';
import {CollectHtmlTraces} from '../types/traces';

const debug = util.debugGenerator('Console Collect');
export default class CollectHTML extends Collect {
	collectId: CollectorsIds = 'htmlcollect';
	static get id() {
		return this.collectId;
	}

	static async collect(
		pageContext: PageContext
	): Promise<CollectHtmlTraces | undefined> {
		try {
			debug('running');
			const {page} = pageContext;
			const result: string[] = [];

			await page.waitForSelector('body');
			const javascriptHtml = await page.evaluate(
				() => document.querySelector('*')!.outerHTML
			);
			const vanillaHtml = await page.content();

			result.push(
				vanillaHtml === javascriptHtml ? javascriptHtml : javascriptHtml,
				vanillaHtml
			);
			debug('done');
			return {
				html: result
			};
		} catch (error) {
			util.log(`Error:Console collect failed with message: ${error.message}`);
			return undefined;
		}
	}
}
