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
const debug = util.debugGenerator('Console Collect');
class CollectHTML extends collect_1.default {
    constructor() {
        super(...arguments);
        this.collectId = 'htmlcollect';
    }
    static get id() {
        return this.collectId;
    }
    static collect(pageContext) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                debug('running');
                const { page } = pageContext;
                const result = [];
                yield page.waitForSelector('body');
                const javascriptHtml = yield page.evaluate(() => document.querySelector('*').outerHTML);
                const vanillaHtml = yield page.content();
                result.push(vanillaHtml === javascriptHtml ? javascriptHtml : javascriptHtml, vanillaHtml);
                debug('done');
                return {
                    html: result
                };
            }
            catch (error) {
                util.log(`Error:Console collect failed with message: ${error.message}`);
                return undefined;
            }
        });
    }
}
exports.default = CollectHTML;
