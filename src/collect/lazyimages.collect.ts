import Collect from './collect';
import {ConnectionSettingsPrivate} from '../types/settings';
import * as util from '../utils/utils';
import {CollectorsIds} from '../types/audit';
import {PageContext} from '../types';
import {CollectLazyImagesTraces} from '../types/traces';
import {Request} from 'puppeteer';
import { DEFAULT } from '../settings/settings';

export default class CollectLazyImages extends Collect {
	collectId: CollectorsIds = 'transfercollect';
	static get id() {
		return this.collectId;
	}

	static async collect(
		pageContext: PageContext,
		settings: ConnectionSettingsPrivate
	): Promise<CollectLazyImagesTraces | undefined> {
		try {
			const debug = util.debugGenerator('Lazy images collect');
			const {page} = pageContext
			await util.safeNavigateTimeout(
				page,
				'networkidle0',
				settings.maxNavigationTime,
				debug
			);
			if(!await util.isPageAbleToScroll(page)){
				throw new Error('Page is unable to scroll')
			}
			const lazyImages: string[] = [];
			const requestListener = () => {
				page.on('requestfinished', (request: Request) => {
					if (request.resourceType() === 'image') {
						lazyImages.push(request.url());
					}
				});
			};


			requestListener();
			await Promise.race([
				util.scrollFunction(page, settings.maxScrollInterval, debug),
				new Promise((resolve)=>setTimeout(()=>resolve(), DEFAULT.CONNECTION_SETTINGS.maxScrollWaitingTime))

			])

			page.emit('scrollFinished')
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
