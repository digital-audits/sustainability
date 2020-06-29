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
const debug = util.debugGenerator('Redirect collect');
class CollectRedirect extends collect_1.default {
    constructor() {
        super(...arguments);
        this.collectId = 'redirectcollect';
    }
    static get id() {
        return this.collectId;
    }
    static collect(pageContext) {
        return __awaiter(this, void 0, void 0, function* () {
            debug('running');
            const results = [];
            const { page, url } = pageContext;
            page.on('response', (response) => {
                const status = response.status();
                const url = response.url();
                if (status >= 300 && status !== 304) {
                    // If the 'Location' header points to a relative URL,
                    // convert it to an absolute URL.
                    // If it already was an absolute URL, it stays like that.
                    const redirectsTo = new URL(response.headers().location, url).toString();
                    const information = {
                        //@ts-ignore
                        requestId: response.request()._requestId,
                        url,
                        redirectsTo
                    };
                    results.push(information);
                }
            });
            const getPageUrl = () => {
                var _a;
                const urls = new Set();
                const initialUrl = new URL(url);
                urls.add(initialUrl);
                const redirect = (_a = results.find(record => new URL(record.url).hostname === initialUrl.hostname)) === null || _a === void 0 ? void 0 : _a.redirectsTo;
                if (redirect) {
                    urls.add(new URL(redirect));
                }
                return Array.from(urls.values());
            };
            try {
                yield util.safeNavigateTimeout(page, 'networkidle0', debug);
                const urls = getPageUrl();
                debug('done');
                return {
                    urls,
                    redirect: results
                };
            }
            catch (error) {
                util.log(`Error: Redirect collect failed with message: ${error.message}`);
                return undefined;
            }
        });
    }
}
exports.default = CollectRedirect;
