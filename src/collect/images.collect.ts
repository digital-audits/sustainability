import {Collect} from './collect';
import {safeNavigateTimeout} from '../helpers/navigateTimeout';
import { PageContext } from '../types/cluster-settings';
import { debugGenerator, log } from '../utils/utils';

const debug = debugGenerator('Collect images')

export class CollectImages extends Collect {
	private static collectId:string='imagescollect'
	static get id(){
		return this.collectId
	}
	static async collect(pageContext: PageContext) {
		debug('running')
		const {page} = pageContext;
		const fetchImages = async () => {
			return page.evaluate(() => {
				const isElementVisible = (el:HTMLElement):boolean =>{
				const bounding = el.getBoundingClientRect();
				const isVisible = (0 < bounding.top && bounding.top < (window.innerHeight || 
				document.documentElement.clientHeight)) || (0 < bounding.bottom && bounding.bottom < (window.innerHeight || document.documentElement.clientHeight));
				return isVisible
			}
				return Array.from(document.body.querySelectorAll('img')).map(
					(img: HTMLImageElement) => {
						const attrObject:{[key:string]:string|boolean} = {}
						attrObject.isVisible = isElementVisible(img)
						img.getAttributeNames().forEach(name => {
							attrObject[name] = img.getAttribute(name)!;
							
						});
						return attrObject;
					}
				);
			});
		};
		await safeNavigateTimeout(page, 'load', debug)
		debug('Fetching document images')
		const images = await fetchImages();
		debug('done')
		

		return {
			media: {images}
		};
	}
}
