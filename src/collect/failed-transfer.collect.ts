import Collect from './collect';
import {PageContext} from '../types';
import * as util from '../utils/utils';
import {Response} from 'puppeteer';

const debug = util.debugGenerator('Failed transfer collect');

export default class CollectFailedTransfers extends Collect {
	collectId: SA.Audit.CollectorsIds = 'failedtransfercollect';
	static get id() {
		return this.collectId;
	}

	static async collect(
		pageContext: PageContext
	): Promise<SA.Traces.CollectFailedTransferTraces | undefined> {
		debug('running');
		const {page} = pageContext;
		const result: SA.Traces.FailedRequest[] = [];
		page.on('response', (response: Response) => {
			const status = response.status();
			const url = response.url();
			if (status >= 400) {
				const information = {
					url,
					code: status,
					statusText: response.statusText(),
					failureText: response.request().failure()?.errorText,
					// @ts-ignore
					requestId: response.request()._requestId
				};

				result.push(information);
			}
		});

		try {
			await util.safeNavigateTimeout(page, 'networkidle0', debug);
			debug('done');
			return {
				failed: result
			};
		} catch (error) {
			util.log(
				`Error: At failed transfer collect with message: ${error.message}`
			);
			return undefined;
		}
	}
}
