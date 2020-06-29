"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const audit_1 = require("./audit");
const util = require("../utils/utils");
/**
 * @fileoverview Audit request in the same origin as host use HTTP2.0
 */
const debug = util.debugGenerator('UsesHTTP2 Audit');
class UsesHTTP2Audit extends audit_1.default {
    static get meta() {
        return {
            id: 'useshttp2',
            title: 'Use HTTP2',
            failureTitle: `Don’t use HTTP2`,
            description: `HTTP2 provides advantages such as:
            multiplexing, server push, binary headers and increased security.`,
            category: 'server',
            collectors: ['transfercollect', 'redirectcollect']
        };
    }
    /**
     * @param traces requiredTraces
     */
    static audit(traces) {
        debug('running');
        const { urls } = traces;
        const auditUrls = new Set();
        traces.record
            .filter(record => {
            const recordUrl = record.request.url;
            if (record.response.fromServiceWorker)
                return false;
            if (record.request.protocol === 'h2')
                return false;
            if (urls.includes(recordUrl))
                return false;
            return true;
        })
            .map((record) => {
            return {
                protocol: record.request.protocol,
                url: record.request.url
            };
        })
            .filter((record) => {
            if (auditUrls.has(record.url))
                return false;
            auditUrls.add(record.url);
            return true;
        });
        const score = Number(auditUrls.size === 0);
        const meta = util.successOrFailureMeta(UsesHTTP2Audit.meta, score);
        debug('done');
        return {
            meta,
            score,
            scoreDisplayMode: 'binary'
        };
    }
}
exports.default = UsesHTTP2Audit;
