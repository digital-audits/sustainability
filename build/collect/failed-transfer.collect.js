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
const debug = util.debugGenerator('Failed transfer collect');
class CollectFailedTransfers extends collect_1.default {
    constructor() {
        super(...arguments);
        this.collectId = 'failedtransfercollect';
    }
    static get id() {
        return this.collectId;
    }
    static collect(pageContext) {
        return __awaiter(this, void 0, void 0, function* () {
            debug('running');
            const { page } = pageContext;
            const result = [];
            page.on('response', (response) => {
                var _a;
                const status = response.status();
                const url = response.url();
                if (status >= 400) {
                    const information = {
                        url,
                        code: status,
                        statusText: response.statusText(),
                        failureText: (_a = response.request().failure()) === null || _a === void 0 ? void 0 : _a.errorText,
                        //@ts-ignore
                        requestId: response.request()._requestId
                    };
                    result.push(information);
                }
            });
            try {
                yield util.safeNavigateTimeout(page, 'networkidle0', debug);
                debug('done');
                return {
                    failed: result
                };
            }
            catch (error) {
                util.log(`Error: At failed transfer collect with message: ${error.message}`);
                return undefined;
            }
        });
    }
}
exports.default = CollectFailedTransfers;
