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
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
Object.defineProperty(exports, "__esModule", { value: true });
const Debug = require("debug");
const memoizee = require("memoizee");
const node_fetch_1 = require("node-fetch");
const settings_1 = require("../settings/settings");
const uuid_1 = require("uuid");
const statistics_1 = require("../bin/statistics");
function debugGenerator(namespace) {
    const debug = Debug(`sustainability: ${namespace}`);
    return debug;
}
exports.debugGenerator = debugGenerator;
const logToConsole = Debug('sustainability:log');
logToConsole.log = console.error.bind(console);
function log(msg) {
    logToConsole(msg);
}
exports.log = log;
function toHexString(codePointArray) {
    return codePointArray.map(codePoint => 'U+' + codePoint.toString(16).toUpperCase());
}
exports.toHexString = toHexString;
// Scroll function credits to nagy.zsolt.hun https://stackoverflow.com/questions/51529332/puppeteer-scroll-down-until-you-cant-anymore
function scrollFunction(page, maxScrollInterval, debug) {
    return __awaiter(this, void 0, void 0, function* () {
        if (debug) {
            debug('running scroll function');
        }
        return page.evaluate((maxScrollInterval) => new Promise(resolve => {
            let scrollTop = -1;
            const interval = setInterval(() => {
                window.scrollBy(0, 100);
                if (document.documentElement.scrollTop !== scrollTop) {
                    scrollTop = document.documentElement.scrollTop;
                    return;
                }
                clearInterval(interval);
                resolve();
            }, maxScrollInterval);
        }), maxScrollInterval);
    });
}
exports.scrollFunction = scrollFunction;
function parseAllSettled(data, audit) {
    const parser = (res) => {
        if (res.status === 'fulfilled' && res.value) {
            return res.value;
        }
        if (res.status === 'rejected') {
            return safeReject(new Error(`Failed with error: ${res.reason}`));
        }
    };
    const result = data.map(res => {
        return parser(res);
    });
    if (!audit) {
        return Object.assign({}, ...result);
    }
    return result
        .filter(data => data)
        //@ts-ignore
        .flatMap((data) => {
        const isArray = Array.isArray(data);
        if (isArray) {
            return data.map((d) => d.value);
        }
        return data;
    });
}
exports.parseAllSettled = parseAllSettled;
function safeReject(error, tracker) {
    if (tracker) {
        if (error.message.startsWith('Navigation timeout')) {
            const urls = tracker.urls();
            if (urls.length > 1) {
                error.message += `\nTracked URLs that have not finished: ${urls.join(', ')}`;
            }
            else if (urls.length > 0) {
                error.message += `\nFor ${urls[0]}`;
            }
            tracker.dispose();
        }
    }
    log(`Error: Navigation failed with message: ${error.message}`);
}
exports.safeReject = safeReject;
function createTracker(page) {
    const requests = new Set();
    const onStarted = (request) => requests.add(request);
    const onFinished = (request) => requests.delete(request);
    page.on('request', onStarted);
    page.on('requestfinished', onFinished);
    page.on('requestfailed', onFinished);
    return {
        urls: () => Array.from(requests).map((r) => r.url()),
        dispose: () => {
            page.removeListener('request', onStarted);
            page.removeListener('requestfinished', onFinished);
            page.removeListener('requestfailed', onFinished);
        }
    };
}
exports.createTracker = createTracker;
const GREEN_SERVER_API = 'http://api.thegreenwebfoundation.org/greencheck';
const isGreenServer = (ip) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const url = `${GREEN_SERVER_API}/${ip}`;
        const response = yield (yield node_fetch_1.default(url)).json();
        return response;
    }
    catch (error) {
        log(`Error: Failed to fetch response from green server API. ${error.message}`);
        return new Promise((resolve) => resolve(undefined));
    }
});
exports.isGreenServerMem = memoizee(isGreenServer, { async: true });
function safeNavigateTimeout(page, waitUntil, debug, cb) {
    return __awaiter(this, void 0, void 0, function* () {
        if (debug) {
            debug('Waiting for navigation to load');
        }
        let stopCallback = null;
        const navigate = () => __awaiter(this, void 0, void 0, function* () {
            yield page.waitForNavigation({ waitUntil });
            clearTimeout(stopNavigation);
        });
        const stopPromise = new Promise(x => (stopCallback = x));
        const stopNavigation = setTimeout(() => stopCallback(cb), settings_1.DEFAULT.CONNECTION_SETTINGS.maxNavigationTime);
        return Promise.race([navigate(), stopPromise]);
    });
}
exports.safeNavigateTimeout = safeNavigateTimeout;
function generate() {
    return uuid_1.v1();
}
exports.generate = generate;
function measure(page, testFunction) {
    return __awaiter(this, arguments, void 0, function* () {
        const initialObjectsNumber = yield exports.countObjects(page);
        yield Reflect.apply(testFunction, null, arguments);
        const finalObjectsNumber = yield exports.countObjects(page);
        return initialObjectsNumber === finalObjectsNumber;
    });
}
exports.default = measure;
// From https://github.com/chrisguttandin/standardized-audio-context/blob/master/test/memory/module.js
/**
 *
 * @param page Puppeteer Page Object
 * @returns number of total objects
 */
exports.countObjects = (page) => __awaiter(void 0, void 0, void 0, function* () {
    const prototypeHandle = yield page.evaluateHandle(() => Object.prototype);
    const objectsHandle = yield page.queryObjects(prototypeHandle);
    const numberOfObjects = yield page.evaluate(instances => instances.length, objectsHandle);
    yield Promise.all([prototypeHandle.dispose(), objectsHandle.dispose()]);
    return numberOfObjects;
});
/**
 * Credits to Google Lighthouse
 *
 * Computes a score between 0 and 1 based on the measured `value`. Score is determined by
 * considering a log-normal distribution governed by two control points (the 10th
 * percentile value and the median value) and represents the percentage of sites that are
 * greater than `value`.
 *
 */
function computeLogNormalScore(controlPoints, value) {
    const percentile = statistics_1.getLogNormalScore(controlPoints, value);
    return exports.clampTo2Decimals(percentile);
}
exports.computeLogNormalScore = computeLogNormalScore;
exports.clampTo2Decimals = (value) => Math.round(value * 100) / 100;
/**
 * @description Computes a global calculated as the average sum of category scores.
*/
function computeScore(audits) {
    return Math.round(statistics_1.sum(audits.map((audit) => audit.score)) / 2);
}
exports.computeScore = computeScore;
function groupAudits(list) {
    const resultsGrouped = statistics_1.groupBy(list, (audit) => audit.meta.category);
    const audits = Array.from(resultsGrouped.keys()).map((key) => {
        const groupByKey = resultsGrouped.get(key);
        const auditsByFailOrPassOrSkip = successOrFailureOrSkipAudits(groupByKey);
        const groupByKeyNonSkip = groupByKey.filter((result) => result.scoreDisplayMode !== 'skip');
        const auditScoreRaw = statistics_1.sum(groupByKeyNonSkip.map((result) => result.score)) /
            groupByKeyNonSkip.length;
        const auditScore = Math.round(auditScoreRaw * 100);
        const catDescription = settings_1.DEFAULT.CATEGORIES[key].description;
        return {
            category: { name: key, description: catDescription },
            score: auditScore,
            audits: auditsByFailOrPassOrSkip
        };
    });
    return audits;
}
exports.groupAudits = groupAudits;
function successOrFailureMeta(meta, score) {
    const { title, failureTitle, collectors } = meta, output = __rest(meta, ["title", "failureTitle", "collectors"]);
    if (failed(score)) {
        return Object.assign({ title: failureTitle }, output);
    }
    return Object.assign({ title }, output);
}
exports.successOrFailureMeta = successOrFailureMeta;
function skipMeta(meta) {
    return { id: meta.id, category: meta.category, description: meta.description };
}
exports.skipMeta = skipMeta;
function failed(score) {
    if (score === 0 || score <= 0.49) {
        return true;
    }
    return false;
}
exports.failed = failed;
function successOrFailureOrSkipAudits(audits) {
    const out = audits.reduce((object, v) => {
        const skipAudit = v.scoreDisplayMode === 'skip';
        (skipAudit ? object.skip : failed(v.score) ? object.fail : object.pass).push(v);
        return object;
    }, { pass: [], fail: [], skip: [] });
    return out;
}
exports.successOrFailureOrSkipAudits = successOrFailureOrSkipAudits;
