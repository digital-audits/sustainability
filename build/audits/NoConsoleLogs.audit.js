"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const audit_1 = require("./audit");
const util = require("../utils/utils");
const fs = require("fs");
const debug = util.debugGenerator('NoConsoleLogs Audit');
class NoConsoleLogsAudit extends audit_1.default {
    static get meta() {
        return {
            id: 'noconsolelogs',
            title: `Don’t have console logs`,
            failureTitle: 'Have console logs',
            description: `It is important to keep the console log clean of error, warning or info outputs.`,
            category: 'design',
            collectors: ['consolecollect']
        };
    }
    static audit(traces) {
        debug('running');
        fs.writeFile('traces.txt', JSON.stringify(traces), (err) => {
            if (err) {
                console.log(err);
            }
        });
        const dups = new Set();
        const uniqueResources = traces.console.filter(trace => {
            const dup = dups.has(trace.text);
            dups.add(trace.text);
            return !dup;
        });
        const score = Number(uniqueResources.length === 0);
        const meta = util.successOrFailureMeta(NoConsoleLogsAudit.meta, score);
        debug('done');
        return Object.assign({ meta,
            score, scoreDisplayMode: 'binary' }, (uniqueResources.length ? {
            extendedInfo: {
                value: uniqueResources
            }
        } : {}));
    }
}
exports.default = NoConsoleLogsAudit;
