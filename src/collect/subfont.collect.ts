import Collect from './collect';
import {PageContext} from '../types';
import * as util from '../utils/utils';
import {CollectorsIds} from '../types/audit';
import {CollectSubfontsTraces, SubfontFormat, FontInformation, GHOutput} from '../types/traces';
import {ConnectionSettingsPrivate} from '../types/settings';

const debug = util.debugGenerator('Subfont collect');

export default class CollectSubfont extends Collect {
	collectId: CollectorsIds = 'subfontcollect';
	static get id() {
		return this.collectId;
	}

	static async collect(
		pageContext: PageContext,
		settings: ConnectionSettingsPrivate
	): Promise<CollectSubfontsTraces | undefined> {
		try {
			// May be interesting to give a try at Page._client.FontFamilies
			debug('running');
			const {page} = pageContext;
			await util.safeNavigateTimeout(
				page,
				'load',
				settings.maxNavigationTime,
				debug
			);
			const result:SubfontFormat[] = await page.evaluate(() => {
				// @ts-ignore
				const hanger = new GlyphHanger();
				hanger.init(document.body);
				const resultJson:GHOutput = hanger.toJSON();

				const fontNames = Object.keys(resultJson);

				const fontsCharSets = Array.from(fontNames).map((font: string) => {
					return {
						name: font,
						value: resultJson[font]
					};
				});

				

				return fontsCharSets;
			});

			debug('done');
			return {
				fonts: result
			};
		} catch (error) {
			util.log(
				`Error: Subfont collector failed with message: ${error.message}`
			);
			return undefined;
		}
	}
}
