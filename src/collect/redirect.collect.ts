import {Collect} from './collect';
import {safeNavigateTimeout} from '../helpers/navigateTimeout';
import { PageContext } from '../types/cluster-settings';
import { debugGenerator } from '../utils/utils';
import { log } from 'util';

const debug = debugGenerator('Redirect collect')
export class CollectRedirect extends Collect {
	private static collectId:string='redirectcollect'
	static get id(){
		return this.collectId
	}
	static async collect(pageContext: PageContext): Promise<any> {
		debug('running')
		const results: any = [];
		const {page} = pageContext;
		page.on('response', (response: any) => {
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
					requestId: response._request._requestId,
					url,
					redirectsTo,
					redirectChain: response._request._redirectChain
				};

				results.push(information);
			}
		});
		try {
			await safeNavigateTimeout(page, 'networkidle0', debug);
			debug('done')
			return {
				redirect: results
			};
		} catch (error) {
			log(`Error: Redirect collect failed with message: ${error.message}`);
		}
	}
}
