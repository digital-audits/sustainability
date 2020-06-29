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
const settings_1 = require("../settings/settings");
const path = require("path");
const fs = require("fs");
const util = require("../utils/utils");
const debug = util.debugGenerator('Commander');
class Commander {
    constructor() {
        this.settings = {};
        this.audits = settings_1.DEFAULT.AUDITS;
        this.tracker = {};
    }
    setUp(pageContext, settings) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                debug('Running set up');
                const { page, url } = pageContext;
                this.settings = settings ? Object.assign(Object.assign({}, settings_1.DEFAULT.CONNECTION_SETTINGS), settings) :
                    settings_1.DEFAULT.CONNECTION_SETTINGS;
                this.tracker = util.createTracker(page);
                // Page.setJavaScriptEnabled(false); Speeds up process drastically
                yield Promise.all([
                    page.setViewport({
                        width: this.settings.emulatedDevice.viewport.width,
                        height: this.settings.emulatedDevice.viewport.height
                    }),
                    page.setUserAgent(this.settings.emulatedDevice.userAgent),
                    page.browserContext().overridePermissions(url, ['geolocation']),
                    page.setGeolocation({
                        latitude: this.settings.location.latitude,
                        longitude: this.settings.location.longitude,
                        accuracy: this.settings.location.accuracy
                    }),
                    page.setCacheEnabled(false),
                    page.setBypassCSP(true),
                    //Glyphhanger dependency
                    page.evaluateOnNewDocument(fs.readFileSync(require.resolve('characterset'), 'utf8')),
                    page.setDefaultNavigationTimeout(0),
                    page.evaluateOnNewDocument(fs.readFileSync(path.resolve(__dirname, '../bin/glyphhanger-script.js'), 'utf8'))
                ]);
                return page;
            }
            catch (error) {
                util.log(`Setup error ${error.message}`);
                process.exit(1);
            }
        });
    }
    navigate(pageContext) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { page, url } = pageContext;
                debug(`Starting navigation to ${url}`);
                let stopCallback = null;
                const stopPromise = new Promise(x => (stopCallback = x));
                const navigateAndClearTimeout = () => __awaiter(this, void 0, void 0, function* () {
                    yield page.goto(url, {
                        waitUntil: 'networkidle0',
                        timeout: 0
                    });
                    clearTimeout(stopNavigation);
                });
                const stopNavigation = setTimeout(() => stopCallback(debug('Forced end of navigation because the URL surpassed the maxNavigationTime')), settings_1.DEFAULT.CONNECTION_SETTINGS.maxNavigationTime);
                yield Promise.race([navigateAndClearTimeout(), stopPromise]);
                page.removeAllListeners('requestfinished');
                page.removeAllListeners('response');
                debug('Done navigation');
            }
            catch (error) {
                util.safeReject(error, this.tracker);
            }
        });
    }
    asyncEvaluate(pageContext) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                debug('Runnining collectors');
                // @ts-ignore
                const traces = yield Promise.allSettled(this.audits.collectors.map((collect) => collect.collect(pageContext)));
                debug('Finished collectors now parsing the traces');
                const parsedTraces = util.parseAllSettled(traces);
                debug('Running audits');
                // @ts-ignore
                return Promise.allSettled(this.audits.audits.map((audit) => audit.audit(parsedTraces)));
            }
            catch (error) {
                util.log(`Error: Commander failed with ${error.message}`);
                return new Promise((resolve, _) => resolve(undefined));
            }
        });
    }
}
exports.default = new Commander();
