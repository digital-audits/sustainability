"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const audit_1 = require("./audit");
const csstree = require("css-tree");
const util = require("../utils/utils");
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
class UsesFontSubsettingAudit extends audit_1.default {
    static get meta() {
        return {
            id: 'fontsubsetting',
            title: 'Use font subsetting',
            failureTitle: `Don’t use font subsetting`,
            description: `Font subsetting is a method to only download the character sets of use. `,
            category: 'design',
            collectors: ['assetscollect', 'subfontcollect']
        };
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
    static audit(traces) {
        const fontsCharSets = traces.fonts.filter(font => !LOCAL_FONTS.includes(font.name.toUpperCase()));
        const isAuditApplicable = () => {
            if (!fontsCharSets.length)
                return false;
            return true;
        };
        if (isAuditApplicable()) {
            debug('running');
            const fonts = new Set();
            traces.css.sheets
                .map(sheet => {
                const { url } = sheet;
                const ast = csstree.parse(sheet.text);
                // Check subsetting at @font-face (unicode-range)
                const fonts = [];
                csstree.walk(ast, {
                    enter(node) {
                        if (node.type === 'Atrule' && node.name === 'font-face') {
                            const hasSubset = node.block.children.some((ch) => {
                                if (ch.property === 'unicode-range') {
                                    return true;
                                }
                                return false;
                            });
                            const fontName = node.block.children
                                .filter((ch) => {
                                if (ch.property === 'font-family') {
                                    return true;
                                }
                                return false;
                            })
                                .tail.data.value.children.map((ch) => ch.value);
                            fonts.push({ fontName, hasSubset });
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
                if (fonts.has(resource.url))
                    return false;
                fonts.add(resource.url);
                return true;
            });
            let fontSubsets = {};
            const score = Number(fonts.size > 0);
            if (score === 0) {
                fontSubsets = fontsCharSets;
            }
            const meta = util.successOrFailureMeta(UsesFontSubsettingAudit.meta, score);
            debug('done');
            return Object.assign({ meta,
                score, scoreDisplayMode: 'binary' }, (Array.from(fontSubsets).length ? {
                extendedInfo: {
                    value: Array.from(fontSubsets)
                }
            } : {}));
        }
        debug('skipping non applicable audit');
        return {
            meta: util.skipMeta(UsesFontSubsettingAudit.meta),
            scoreDisplayMode: 'skip'
        };
    }
}
exports.default = UsesFontSubsettingAudit;
