import Collect from './collect';
import {PageContext} from '../types';
import * as util from '../utils/utils';

const debug = util.debugGenerator('Collect images');

export default class CollectImages extends Collect {
	collectId: SA.Audit.CollectorsIds = 'imagescollect';
	static get id() {
		return this.collectId;
	}

	static async collect(
		pageContext: PageContext
	): Promise<SA.Traces.CollectImagesTraces> {
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
						const attrObject = {} as SA.Traces.ImageFormat;
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
