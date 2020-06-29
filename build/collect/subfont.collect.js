"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const collect_1 = require("./collect");
const util = require("../utils/utils");
const debug = util.debugGenerator('Subfont collect');
class CollectSubfont extends collect_1.default {
    constructor() {
        super(...arguments);
        this.collectId = 'subfontcollect';
    }
    static get id() {
        return this.collectId;
    }
    static collect(pageContext) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                // May be interesting to give a try at Page._client.FontFamilies
                debug('running');
                const { page } = pageContext;
                yield util.safeNavigateTimeout(page, 'load', debug);
                const result = yield page.evaluate(() => {
                    // @ts-ignore
                    const hanger = new GlyphHanger();
                    const toHex = function (codePointArray) {
                        return codePointArray.map(codePoint => 'U+' + codePoint.toString(16).toUpperCase());
                    };
                    hanger.init(document.body);
                    const resultJson = hanger.toJSON();
                    const fontNames = Object.keys(resultJson);
                    const fontsCharSets = Array.from(fontNames).map((font) => {
                        return {
                            name: font,
                            value: toHex(resultJson[font])
                        };
                    });
                    return fontsCharSets;
                });
                debug('done');
                return {
                    fonts: result
                };
            }
            catch (error) {
                util.log(`Error: Subfont collector failed with message: ${error.message}`);
                return undefined;
            }
        });
    }
}
exports.default = CollectSubfont;
