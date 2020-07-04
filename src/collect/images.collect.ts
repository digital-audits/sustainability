import Collect from './collect';
import {PageContext} from '../types';
import * as util from '../utils/utils';
import { ImageFormat, CollectImagesTraces} from '../types/traces';
import { CollectorsIds } from '../types/audit';

const debug = util.debugGenerator('Collect images');

export default class CollectImages extends Collect {
	collectId: CollectorsIds = 'imagescollect';
	static get id() {
		return this.collectId;
	}

	static async collect(
		pageContext: PageContext
	): Promise<CollectImagesTraces> {
		debug('running');
		const {page} = pageContext;
		const fetchImages = async () => {
			return page.evaluate(() => {
				const isElementVisible = (element: HTMLElement): boolean => {
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

				return Array.from(document.body.querySelectorAll('img')).map(
					(img: HTMLImageElement) => {
						const attrObject = {} as ImageFormat;
						attrObject.isVisible = isElementVisible(img);
						img.getAttributeNames().forEach(name => {
							attrObject[name] = img.getAttribute(name)!;
						});
						return attrObject;
					}
				);
			});
		};

		await util.safeNavigateTimeout(page, 'load', debug);
		debug('Fetching document images');
		const images = await fetchImages();
		debug('done');

		return {
			media: {images}
		};
	}
}
