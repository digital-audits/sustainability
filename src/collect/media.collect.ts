import Collect from './collect';
import {PageContext} from '../types';
import * as util from '../utils/utils';
import {CollectMediaTraces, MediaFormat} from '../types/traces';
import {PrivateSettings} from '../types/settings';
import {CollectMeta} from '../types/audit';

export default class CollectMedia extends Collect {
	static get meta() {
		return {
			id: 'mediacollect',
			passContext: 'networkidle0',
			debug: util.debugGenerator('Collect media')
		} as CollectMeta;
	}

	static async collect(
		pageContext: PageContext,
		settings: PrivateSettings
	): Promise<CollectMediaTraces> {
		const debug = CollectMedia.meta.debug;
		debug('running');
		const {page} = pageContext;
		const fetchMedia = async () => {
			return page.evaluate(() => {
				const isElementVisible = (element: Element): boolean => {
					const bounding = element.getBoundingClientRect();
					const isVisible =
						(bounding.top > 0 &&
							bounding.top <
								(window.innerHeight ||
									document.documentElement.clientHeight)) ||
						(bounding.bottom > 0 &&
							bounding.bottom <
								(window.innerHeight || document.documentElement.clientHeight));
					return isVisible;
				};

				const processMedia = (elements: Element[]) => {
					return elements?.map(img => {
						const attrObject = {} as MediaFormat;
						attrObject.isVisible = isElementVisible(img);
						img.getAttributeNames().forEach(name => {
							attrObject[name] = img.getAttribute(name)!;
						});
						return attrObject;
					});
				};

				return {
					images: processMedia(
						Array.from(document.body.querySelectorAll('img'))
					),
					videos: processMedia(
						Array.from(document.body.querySelectorAll('video'))
					)
				};
			});
		};

		await util.safeNavigateTimeout(
			page,
			'load',
			settings.maxNavigationTime,
			debug
		);
		debug('Fetching document media');
		const media = await fetchMedia();
		debug('done');
		return {
			media
		};
	}
}
