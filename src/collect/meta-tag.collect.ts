import {PageContext} from '../types';
import {CollectorsIds, Meta} from '../types/audit';
import Collect from './collect';
import * as util from '../utils/utils';
import {ConnectionSettingsPrivate} from '../types/settings';
import {MetaTagFormat, CollectMetaTagsTraces, MetaTag} from '../types/traces';

export default class CollectMetaTags extends Collect {
	static get meta() {
		return {
			id:'metatagscollect',
			passContext: 'networkidle0',
			debug:util.debugGenerator('Meta tags collect'),
		}
	}

	static async collect(
		pageContext: PageContext,
		settings: ConnectionSettingsPrivate
	): Promise<CollectMetaTagsTraces | undefined> {
		const debug = CollectMetaTags.meta.debug
		debug('running');
		const {page} = pageContext;

		await page.waitForSelector('meta');
		const metaTags = await page.evaluate(() => {
			const metaTags: MetaTagFormat[] = [];
			const getElementAttributes = (element: HTMLElement) =>
				element.getAttributeNames().map((attr: string) => {
					const attrObject: MetaTag = {};

					attrObject[attr] = element.getAttribute(attr)!;

					return attrObject;
				});

			Array.from(document.querySelectorAll('meta')).forEach(
				(meta: HTMLMetaElement) => {
					const attr = getElementAttributes(meta);
					metaTags.push({attr});
				}
			);

			return metaTags;
		});
		debug('done');
		return {
			metatag: metaTags
		};
	}
}
