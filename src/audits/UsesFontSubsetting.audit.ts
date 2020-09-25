import Audit from './audit';
import csstree = require('css-tree');
import * as util from '../utils/utils';
import {SubfontFormat, Traces} from '../types/traces';
import {Result, SkipResult, Meta} from '../types/audit';

/**
 * @description Find non-local fonts (i.e downloaded) and assert whether they are a subset.
 */
export default class UsesFontSubsettingAudit extends Audit {
	static get meta() {
		return {
			id: 'fontsubsetting',
			title: 'Use font subsetting',
			failureTitle: `Don’t use font subsetting`,
			description: `Font subsetting is a method to only download the character sets of use. <a href="https://web.dev/reduce-webfont-size/#unicode-range-subsetting">More info</a>`,
			category: 'design',
			collectors: ['assetscollect', 'subfontcollect']
		} as Meta;
	}

	/**
	 * @applicable if font resources were downloaded and fonts traces exists.
	 *
	 *
	 * @workflow 1-Walk CSS sheets to find font-face rules and extract the font-family value and assess whether
	 * 	unicode-range directive is present (hence font is subsetted).
	 *
	 * 	2-Filter out those that are not included in the fonts traces.
	 *
	 */
	static audit(traces: Traces): Result | SkipResult {
		const debug = util.debugGenerator('UsesFontSubsetting Audit');
		const allCssSheets = [...traces.css.sheets, ...traces.css.info.styles];
		const isAuditApplicable = (): boolean => {
			if (allCssSheets.length === 0) return false;
			if (!(traces.fonts.length > 0)) return false;
			if (
				!traces.record.some(
					resource => resource.request.resourceType === 'font'
				)
			)
				return false;

			return true;
		};

		if (isAuditApplicable()) {
			debug('running');
			const fonts: Array<{fontName: string; hasSubset: boolean}> = [];

			allCssSheets.map(sheet => {
				const ast = csstree.parse(sheet.text);
				csstree.walk(ast, {
					enter(node: any) {
						if (node.type === 'Atrule' && node.name === 'font-face') {
							const hasSubset: boolean = node.block.children.some((ch: any) => {
								if (ch.property === 'unicode-range') {
									return true;
								}

								return false;
							});
							let fontName: string | undefined;
							node.block.children
								.filter((ch: any) => {
									if (ch.property === 'font-family') {
										return true;
									}

									return false;
								})
								.tail.data.value.children.map((ch: any) => {
									if ((ch.value && ch.value !== '') || ch.name) {
										const text = ch.value || ch.name;
										fontName = util.removeQuotes(text);
									}
								});
							if (fontName) {
								fonts.push({fontName, hasSubset});
							}
						}
					}
				});
			});

			const nonSubsetFonts = fonts.filter(font => {
				if (font.hasSubset) {
					return false;
				}

				return true;
			});

			let fontSubsets = {} as SubfontFormat[];
			const score = Number(nonSubsetFonts.length === 0);
			if (score === 0) {
				const fontChars = traces.fonts.filter(font =>
					nonSubsetFonts
						.map(subfont => subfont.fontName.toLocaleLowerCase())
						.includes(font.name.toLocaleLowerCase())
				);
				fontSubsets = fontChars.length > 0 ? fontChars : traces.fonts;
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
