import Audit from './audit';
import csstree = require('css-tree');
import * as util from '../utils/utils';
import { SubfontFormat, Traces } from '../types/traces';
import { Result, SkipResult, Meta } from '../types/audit';

const debug = util.debugGenerator('UsesFontSubsetting Audit');
const LOCAL_FONTS = [
	'ARIAL',
	'ARIAL BLACK',
	'COMIC SANS MS',
	'GEORGIA',
	'IMPACT',
	'TIMES NEW ROMAN',
	'TREBUCHET MS',
	'VERDANA',
	'-APPLE-SYSTEM',
	'*'
];

/**
 * @description Find non-local fonts (i.e downloaded) and assert whether they are a subset.
 */
export default class UsesFontSubsettingAudit extends Audit {
	static get meta() {
		return {
			id: 'fontsubsetting',
			title: 'Use font subsetting',
			failureTitle: `Don’t use font subsetting`,
			description: `Font subsetting is a method to only download the character sets of use. `,
			category: 'design',
			collectors: ['assetscollect', 'subfontcollect']
		} as Meta;
	}

	// Csstraces / css/ styles/ href | text
	/**
	 * @applicable if uses nonLocalfonts (i.e fonts that are downloaded)
	 *
	 * @fileoverview The workflow is:
	 * 1-Filter out local fonts (not downloaded)
	 * 2-Find for each font if it is subsetted in :
	 *      2.1 @font-face rules using unicode range propiety
	 *
	 *
	 */
	static audit(
		traces: Traces
	): Result | SkipResult {
		const fontsCharSets = traces.fonts.filter(
			font => !LOCAL_FONTS.includes(font.name.toUpperCase())
		);

		const isAuditApplicable = (): boolean => {
			if (!fontsCharSets.length) return false;
			return true;
		};

		if (isAuditApplicable()) {
			debug('running');

			const fonts = new Set();
			traces.css.sheets
				.map(sheet => {
					const {url} = sheet;
					const ast = csstree.parse(sheet.text);

					// Check subsetting at @font-face (unicode-range)
					const fonts: Array<{fontName: string; hasSubset: boolean}> = [];
					csstree.walk(ast, {
						enter(node: any) {
							if (node.type === 'Atrule' && node.name === 'font-face') {
								const hasSubset: boolean = node.block.children.some(
									(ch: any) => {
										if (ch.property === 'unicode-range') {
											return true;
										}

										return false;
									}
								);

								const fontName: string = node.block.children
									.filter((ch: any) => {
										if (ch.property === 'font-family') {
											return true;
										}

										return false;
									})
									.tail.data.value.children.map((ch: any) => ch.value);

								fonts.push({fontName, hasSubset});
							}
						}
					});

					return {
						url,
						fontSubsets: fonts
					};
				})
				.filter(resource => {
					// We need to compare fontnames to nonLocalFonts array
					if (resource.fontSubsets.some(font => font.hasSubset)) {
						return true;
					}

					return false;
				})
				.filter(resource => {
					if (fonts.has(resource.url)) return false;
					fonts.add(resource.url);
					return true;
				});

			let fontSubsets = {} as SubfontFormat[];
			const score = Number(fonts.size > 0);
			if (score === 0) {
				fontSubsets = fontsCharSets;
			}

			const meta = util.successOrFailureMeta(
				UsesFontSubsettingAudit.meta,
				score
			);
			debug('done');
			return {
				meta,
				score,
				scoreDisplayMode: 'binary',
				...(Array.from(fontSubsets).length
					? {
							extendedInfo: {
								value: Array.from(fontSubsets)
							}
					  }
					: {})
			};
		}

		debug('skipping non applicable audit');

		return {
			meta: util.skipMeta(UsesFontSubsettingAudit.meta),
			scoreDisplayMode: 'skip'
		};
	}
}
