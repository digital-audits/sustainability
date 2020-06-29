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
class CollectPerformance extends collect_1.default {
    constructor() {
        super(...arguments);
        this.collectId = 'performancecollect';
    }
    static get id() {
        return this.collectId;
    }
    static collect(pageContext) {
        return __awaiter(this, void 0, void 0, function* () {
            const { page } = pageContext;
            yield util.safeNavigateTimeout(page, 'load');
            const perf = yield page.evaluate(() => performance.toJSON());
            const metrics = yield page.metrics();
            const info = {
                perf,
                metrics
            };
            return {
                performance: info
            };
        });
    }
}
exports.default = CollectPerformance;
