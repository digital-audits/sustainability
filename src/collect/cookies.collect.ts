import {PageContext} from '../types';
import {ConnectionSettingsPrivate} from '../types/settings';
import Collect from './collect';
import * as util from '../utils/utils';
import {CollectCookiesTraces} from '../types/traces';

export default class CollectCookies extends Collect {
	static get meta() {
		return {
			id:'cookiescollect',
			passContext: 'networkidle0',
			debug:util.debugGenerator('Cookies collect'),
		}
	}

	static async collect(
		pageContext: PageContext,
		settings: ConnectionSettingsPrivate
	): Promise<CollectCookiesTraces | undefined> {
		try {
			const debug = CollectCookies.meta.debug
			debug('running');
			const {page} = pageContext;
			await util.safeNavigateTimeout(
				page,
				'networkidle0',
				settings.maxNavigationTime,
				debug
			);
			const cookieJar = await page.cookies();
			debug('done');
			return {
				cookies: cookieJar
			};
		} catch (error) {
			util.log(error);
			return undefined;
		}
	}
}
