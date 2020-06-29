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
const debug = util.debugGenerator('Console collect');
class CollectConsole extends collect_1.default {
    constructor() {
        super(...arguments);
        this.collectId = 'consolecollect';
    }
    static get id() {
        return this.collectId;
    }
    static collect(pageContext) {
        return __awaiter(this, void 0, void 0, function* () {
            debug('running');
            const { page } = pageContext;
            const results = [];
            page.on('console', (message) => __awaiter(this, void 0, void 0, function* () {
                const information = {
                    type: message.type(),
                    text: message.text()
                };
                /**
                Console log client messages. Useful for debugging page evaluate
                    for (let i = 0; i < message.args().length; ++i) {
                        debug(`${i}: ${message.args()[i]}`);
                    }
    
                    */
                results.push(information);
            }));
            try {
                yield util.safeNavigateTimeout(page, 'networkidle0', debug);
                return {
                    console: results
                };
            }
            catch (error) {
                util.log(`Error: Console collect failed with message: ${error.message}`);
                return undefined;
            }
        });
    }
}
exports.default = CollectConsole;
