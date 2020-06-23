import {Collect} from './collect';
import {safeNavigateTimeout} from '../helpers/navigateTimeout';
import { PageContext } from '../types/cluster-settings';
import { debugGenerator } from '../utils/utils';
import { log } from 'util';

const debug = debugGenerator('Failed transfer collect')

export class CollectFailedTransfers extends Collect {
	private static collectId:string='failedtransfercollect'
	static get id(){
		return this.collectId
	}
	static async collect(pageContext: PageContext): Promise<any> {

		debug('running')
		const {page} = pageContext;
		const result: any = [];
		page.on('response', (response: any) => {
			const status = response.status;
			const url = response.url;
			if (status >= 400) {
				const information = {
					url,
					code: status,
					statusText: response._statusText,
					failureText: response._request._failureText,
					requestId: response._request._requestId
				};

				result.push(information);
			}
		});

		try {
			debug('Waiting for navigation to load')
			await safeNavigateTimeout(page, 'networkidle0', debug);
			debug('done')
			return {
				failed: result
			};
		} catch (error) {
			log(`Error: At failed transfer collect with message: ${error.message}`)
		}
	}
}
