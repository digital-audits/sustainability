import Collect from './collect';
import {PageContext} from '../types';
import * as util from '../utils/utils';
import {CollectMeta} from '../types/audit';
import {CollectHtmlTraces} from '../types/traces';

export default class CollectHTML extends Collect {
	static get meta() {
		return {
			id: 'htmlcollect',
			passContext: 'networkidle0',
			debug: util.debugGenerator('HTML Collect')
		} as CollectMeta;
	}

	static async collect(
		pageContext: PageContext
	): Promise<CollectHtmlTraces | undefined> {
		try {
			const debug = CollectHTML.meta.debug;
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
