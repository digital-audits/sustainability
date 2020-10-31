import Collect from './collect';
import {PageContext} from '../types';
import * as util from '../utils/utils';
import {Response} from 'puppeteer';
import {CollectMeta} from '../types/audit';
import {CollectRedirectTraces, RedirectResponse} from '../types/traces';
import {ConnectionSettingsPrivate} from '../types/settings';

export default class CollectRedirect extends Collect {
	static get meta() {
		return {
			id: 'redirectcollect',
			passContext: 'networkidle0',
			debug: util.debugGenerator('Redirect collect')
		} as CollectMeta;
	}

	static async collect(
		pageContext: PageContext,
		settings: ConnectionSettingsPrivate
	): Promise<CollectRedirectTraces | undefined> {
		const debug = CollectRedirect.meta.debug;
		debug('running');
		const results: RedirectResponse[] = [];
		const {page, url} = pageContext;

		page.on('response', (response: Response) => {
			const status = response.status();
			const url = response.url();
			if (status >= 300 && status !== 304 && status <= 399) {
				const redirectsTo = new URL(
					response.headers().location,
					url
				).toString();
				const information = {
					// @ts-ignore
					requestId: response.request()._requestId,
					url,
					redirectsTo
				};

				results.push(information);
			}
		});
		const getPageHosts = () => {
			const hosts = new Set<string>();
			const initialHost = new URL(url).hostname;
			hosts.add(initialHost);
			const redirect = results.find(
				record => new URL(record.url).hostname === initialHost
			)?.redirectsTo;

			if (redirect) {
				hosts.add(new URL(redirect).hostname);
			}

			return Array.from(hosts.values());
		};

		try {
			await util.safeNavigateTimeout(
				page,
				'networkidle0',
				settings.maxNavigationTime,
				debug
			);
			const hosts = getPageHosts();
			debug('done');
			return {
				hosts,
				redirect: results
			};
		} catch (error) {
			util.log(`Error: Redirect collect failed with message: ${error.message}`);
			return undefined;
		}
	}
}
