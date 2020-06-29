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
const connection_1 = require("../connection/connection");
const commander_1 = require("../commander/commander");
const utils_1 = require("../utils/utils");
const util = require("../utils/utils");
class Sustainability {
    static audit(url, options) {
        return __awaiter(this, void 0, void 0, function* () {
            const sustainability = new Sustainability();
            const browser = (options === null || options === void 0 ? void 0 : options.browser) || (yield sustainability.startNewConnectionAndReturnBrowser(options === null || options === void 0 ? void 0 : options.launchSettings));
            try {
                const page = (options === null || options === void 0 ? void 0 : options.page) || (yield browser.newPage());
                try {
                    const pageContext = { page, url };
                    const report = yield sustainability.handler(pageContext, options);
                    return report;
                }
                catch (error) {
                    utils_1.log(`Error: Audit failed with message: ${error.message}`);
                    process.exit(1);
                }
                finally {
                    yield page.close();
                }
            }
            catch (error) {
                utils_1.log(`Error: Failed to launch page: ${error.message}`);
                process.exit(1);
            }
            finally {
                yield browser.close();
            }
        });
    }
    startNewConnectionAndReturnBrowser(options) {
        return __awaiter(this, void 0, void 0, function* () {
            const browser = yield connection_1.default.setUp(options);
            return browser;
        });
    }
    handler(pageContextRaw, options) {
        return __awaiter(this, void 0, void 0, function* () {
            const startTime = Date.now();
            const projectId = (options === null || options === void 0 ? void 0 : options.id) || util.generate();
            const { url } = pageContextRaw;
            const page = yield commander_1.default.setUp(pageContextRaw, options === null || options === void 0 ? void 0 : options.connectionSettings);
            const pageContext = Object.assign(Object.assign({}, pageContextRaw), { page });
            // @ts-ignore allSettled lacks typescript support
            const results = yield Promise.allSettled([
                commander_1.default.navigate(pageContext),
                commander_1.default.asyncEvaluate(pageContext)
            ]);
            const resultsParsed = util.parseAllSettled(results, true);
            const audits = util.groupAudits(resultsParsed);
            const globalScore = util.computeScore(audits);
            const meta = {
                id: projectId,
                url,
                timing: [startTime, Date.now()]
            };
            return {
                globalScore,
                meta,
                audits
            };
        });
    }
}
exports.default = Sustainability;
