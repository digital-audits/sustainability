import Collect from './collect';
import { PageContext } from '../types/index';
import * as util from '../utils/utils';
import {Response} from 'puppeteer'


const debug = util.debugGenerator('Redirect collect')
export default class CollectRedirect extends Collect {
	collectId:SA.Audit.CollectorsIds='redirectcollect'
	static get id(){
		return this.collectId
	}
	static async collect(pageContext: PageContext): Promise<SA.Traces.CollectRedirectTraces | undefined> {
		debug('running')
		const results: SA.Traces.RedirectResponse[] = [];
		const {page, url} = pageContext;
		page.on('response', (response: Response) => {
			const status = response.status();
			const url = response.url();

			if (status >= 300 && status !== 304) {
				// If the 'Location' header points to a relative URL,
				// convert it to an absolute URL.
				// If it already was an absolute URL, it stays like that.
				const redirectsTo = new URL(
					response.headers().location,
					url
				).toString();
				const information = {
					//@ts-ignore
					requestId: response.request()._requestId,
					url,
					redirectsTo
				};

				results.push(information);
			}
		});
		const getPageUrl = () =>{
			const urls = new Set<URL>();
			const initialUrl = new URL(url);
			urls.add(initialUrl);
			const redirect = results.find(
				record => new URL(record.url).hostname === initialUrl.hostname
			)?.redirectsTo;

			if (redirect) {
				urls.add(new URL(redirect));
			}
			return Array.from(urls.values())
		}
		try {
			await util.safeNavigateTimeout(page, 'networkidle0', debug);
			const urls = getPageUrl()
			debug('done')
			return {
				urls,
				redirect: results

			};
		} catch (error) {
			util.log(`Error: Redirect collect failed with message: ${error.message}`);
			return undefined
		}
	}
}
