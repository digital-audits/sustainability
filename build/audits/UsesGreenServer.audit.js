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
const audit_1 = require("./audit");
const util = require("../utils/utils");
const debug = util.debugGenerator('UsesGreenServer Audit');
class UsesGreenServerAudit extends audit_1.default {
    static get meta() {
        return {
            id: 'greenserver',
            title: `Server 100% renewable-powered`,
            failureTitle: `Server running on fossil fuels`,
            description: `It is important to make sure a server uses renewable-powered energy to host a website. Green hosting your website it is as easy as selecting a green web hosting provider.`,
            category: 'server',
            collectors: ['transfercollect', 'redirectcollect']
        };
    }
    static audit(traces) {
        var _a;
        return __awaiter(this, void 0, void 0, function* () {
            debug('running');
            const { urls } = traces;
            const ipAddress = (_a = traces.record.find(record => {
                const recordUrl = record.response.url;
                return urls.includes(recordUrl);
            })) === null || _a === void 0 ? void 0 : _a.response.remoteAddress.ip;
            debug('evaluating energy source');
            const response = yield util.isGreenServerMem(ipAddress);
            if (response) {
                const { green, hostedby } = response;
                const score = Number(green);
                const meta = util.successOrFailureMeta(UsesGreenServerAudit.meta, score);
                debug('done');
                return Object.assign({ meta,
                    score, scoreDisplayMode: 'binary' }, (hostedby ? {
                    extendedInfo: {
                        value: { hostedby }
                    }
                } : {}));
            }
            else {
                debug('failed to fetch response');
                return {
                    meta: util.skipMeta(UsesGreenServerAudit.meta),
                    scoreDisplayMode: 'skip',
                    errorMessage: 'Failed to fetch response body'
                };
            }
        });
    }
}
exports.default = UsesGreenServerAudit;
