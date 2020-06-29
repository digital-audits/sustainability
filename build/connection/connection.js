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
/**
 * Configuration for the connection
 * Override default config options by calling it with your options.
 */
const settings_1 = require("../settings/settings");
const puppeteer_1 = require("puppeteer");
const util = require("../utils/utils");
const debug = util.debugGenerator('Connection');
class Connection {
    constructor() {
        this.launchSettings = {};
    }
    setUp(launchSettings) {
        return __awaiter(this, void 0, void 0, function* () {
            this.launchSettings = launchSettings || settings_1.DEFAULT.LAUNCH_SETTINGS;
            if (process.env.CHROME_BIN) {
                this.launchSettings.executablePath = process.env.CHROME_BIN;
            }
            debug('Launching browser');
            const browser = yield puppeteer_1.launch(this.launchSettings);
            return browser;
        });
    }
}
exports.default = new Connection();
