import Collect from './collect';
import {PageContext} from '../types';
import * as util from '../utils/utils';
import {Response} from 'puppeteer';
import {CollectorsIds} from '../types/audit';
import {CollectRedirectTraces, RedirectResponse} from '../types/traces';
import {ConnectionSettingsPrivate} from '../types/settings';

export default class CollectRedirect extends Collect {
	collectId: CollectorsIds = 'redirectcollect';
	static get id() {
		return this.collectId;
	}

	static async collect(
		pageContext: PageContext,
		settings: ConnectionSettingsPrivate
	): Promise<CollectRedirectTraces | undefined> {
		const debug = util.debugGenerator('Redirect collect');
		debug('running');
		const results: RedirectResponse[] = [];
		const {page, url} = pageContext;

		page.on('response', (response: Response) => {
			const status = response.status();
			const url = response.url();
			if (status >= 300 && status !== 304 && status <= 399) {
				// If the 'Location' header points to a relative URL,
				// convert it to an absolute URL.
				// If it already was an absolute URL, it stays like that.

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
