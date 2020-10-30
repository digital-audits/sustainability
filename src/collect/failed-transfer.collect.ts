import Collect from './collect';
import {PageContext} from '../types';
import * as util from '../utils/utils';
import {Response} from 'puppeteer';
import {CollectorsIds} from '../types/audit';
import {CollectFailedTransferTraces, FailedRequest} from '../types/traces';
import {ConnectionSettingsPrivate} from '../types/settings';

const debug = util.debugGenerator('Failed transfer collect');

export default class CollectFailedTransfers extends Collect {
	static get meta() {
		return {
			id:'failedtransfercollect',
			passContext: 'networkidle0',
			debug:util.debugGenerator('Failed transfer collect')
		}
	}

	static async collect(
		pageContext: PageContext,
		settings: ConnectionSettingsPrivate
	): Promise<CollectFailedTransferTraces | undefined> {
		const debug = CollectFailedTransfers.meta.debug
		debug('running');
		try {
			const {page} = pageContext;
			const result: FailedRequest[] = [];
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
