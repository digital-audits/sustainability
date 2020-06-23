import {Collect} from './collect';
import {safeNavigateTimeout} from '../helpers/navigateTimeout';
import { PageContext } from '../types/cluster-settings';
import {debugGenerator, log } from '../utils/utils';


const debug = debugGenerator('Subfont collect')

export class CollectSubfont extends Collect {
	private static collectId:string='subfontcollect'
	static get id(){
		return this.collectId
	}
	static async collect(pageContext: PageContext): Promise<any> {
		try {
			// May be interesting to give a try at Page._client.FontFamilies
			debug('running')
			const {page} = pageContext;
			await safeNavigateTimeout(page,'load', debug);
			const result = await page.evaluate(()=>{
					// @ts-ignore
					const hanger = new GlyphHanger();
					const toHex = function(codePointArray:number[]){
						return codePointArray.map(codePoint=>'U+' + codePoint.toString(16).toUpperCase())
					}
					hanger.init(document.body);
					const resultJson = hanger.toJSON();

					const fontNames = Object.keys(resultJson)

					const fontsCharSets = Array.from(fontNames).map((font: string) => {
						return {name: font,
							value: toHex(resultJson[font])
						};
					});

					return fontsCharSets;
			})

			debug('done')
			return {
				fonts: result
			};
		} catch (error) {
			log(`Error: Subfont collector failed with message: ${error.message}`)
		}
	}
}
