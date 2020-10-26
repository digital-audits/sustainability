import Collect from './collect';
import {ConnectionSettingsPrivate} from '../types/settings';
import * as util from '../utils/utils';
import {CollectorsIds} from '../types/audit';
import {PageContext} from '../types';
import {CollectLazyMediaTraces} from '../types/traces';
import {Request} from 'puppeteer';

export default class CollectLazyMedia extends Collect {
	collectId: CollectorsIds = 'transfercollect';
	static get id() {
		return this.collectId;
	}

	static async collect(
		pageContext: PageContext,
		settings: ConnectionSettingsPrivate
	): Promise<CollectLazyMediaTraces | undefined> {
		try {
			const debug = util.debugGenerator('Lazy media collect');
			const {page} = pageContext;
			await util.safeNavigateTimeout(
				page,
				'networkidle0',
				settings.maxNavigationTime,
				debug
			);
			if (!(await util.isPageAbleToScroll(page))) {
				throw new Error('Page is unable to scroll');
			}

			const lazyImages: string[] = [];
			const lazyVideos: string[] = [];
			const requestListener = () => {
				page.on('requestfinished', (request: Request) => {
					if (request.resourceType() === 'image') {
						lazyImages.push(request.url());
					}

					if (request.resourceType() === 'media') {
						lazyVideos.push(request.url());
					}
				});
			};

			requestListener();

			await util.scrollFunction(page, settings.maxScrollInterval, debug),
				page.removeAllListeners('requestfinished');
			debug('done');

			return {
				lazyMedia: {
					lazyImages,
					lazyVideos
				}
			};
		} catch (error) {
			util.log(`Error: Lazy Media collect failed with message: ${error}`);
			return undefined;
		}
	}
}
