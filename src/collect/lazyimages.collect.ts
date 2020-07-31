import Collect from './collect';
import {ConnectionSettingsPrivate} from '../types/settings';
import * as util from '../utils/utils';
import {CollectorsIds} from '../types/audit';
import {PageContext} from '../types';
import {CollectLazyImagesTraces} from '../types/traces';
import {Request} from 'puppeteer';

export default class CollectLazyImages extends Collect {
	collectId: CollectorsIds = 'lazyimagescollect';
	static get id() {
		return this.collectId;
	}

	static async collect(
		pageContext: PageContext,
		settings: ConnectionSettingsPrivate
	): Promise<CollectLazyImagesTraces | undefined> {
		try {
			const debug = util.debugGenerator('Lazy images collect');
			const {page} = pageContext;
			const lazyImages: string[] = [];
			const requestListener = () => {
				page.on('requestfinished', (request: Request) => {
					if (request.resourceType() === 'image') {
						lazyImages.push(request.url());
					}
				});
			};

			await util.safeNavigateTimeout(
				page,
				'networkidle0',
				settings.maxNavigationTime,
				debug
			);

			requestListener();
			await util.scrollFunction(page, settings.maxScrollInterval, debug);
			debug('done scrolling');
			page.removeAllListeners('requestfinished');
			debug('done');

			return {
				lazyImages
			};
		} catch (error) {
			util.log(`Error: Lazy images collect failed with message: ${error}`);
			return undefined;
		}
	}
}
