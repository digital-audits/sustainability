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
const debug = util.debugGenerator('Collect assets');
class CollectAssets extends collect_1.default {
    constructor() {
        super(...arguments);
        this.collectId = 'assetscollect';
    }
    static get id() {
        return this.collectId;
    }
    static collect(pageContext) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                debug('running');
                const { page } = pageContext;
                const sheets = [];
                const scripts = [];
                page.on('requestfinished', (request) => __awaiter(this, void 0, void 0, function* () {
                    const response = request.response();
                    const url = response.url();
                    const resourceType = response.request().resourceType();
                    if (request.redirectChain().length === 0 && response.ok()) {
                        if (resourceType === 'stylesheet') {
                            const text = yield response.text();
                            const stylesheet = {
                                url,
                                text
                            };
                            sheets.push(stylesheet);
                        }
                        if (resourceType === 'script') {
                            const text = yield response.text();
                            const script = {
                                url,
                                text
                            };
                            scripts.push(script);
                        }
                    }
                }));
                yield util.safeNavigateTimeout(page, 'load', debug);
                const documentInformation = yield page.evaluate(() => {
                    const styleHrefs = [];
                    const scriptSrcs = [];
                    const styles = [];
                    const scripts = [];
                    const isCssStyleTag = (element) => element.tagName === 'STYLE' &&
                        (!element.type || element.type.toLowerCase() === 'text/css');
                    const isJsScriptTag = (element) => element.tagName === 'SCRIPT' &&
                        (!element.type || element.type.toLowerCase() === 'text/javascript');
                    const isStylesheetLink = (element) => element.tagName === 'LINK' &&
                        element.href &&
                        element.rel.toLowerCase() === 'stylesheet' &&
                        !element.href.toLowerCase().startsWith('data:') &&
                        !element.href.toLowerCase().startsWith('blob:') &&
                        element.media.toLowerCase() !== 'print';
                    // #fragments are omitted from puppeteer's response.url(), so
                    // we need to strip them from stylesheet links, otherwise the
                    // hrefs won't always match when we check for missing ASTs.
                    const defragment = (href) => href.split('#')[0];
                    const pageUrl = defragment(window.location.href);
                    // Create a unique identifier for each style tag by appending
                    // an xpath-like fragment to the page URL.  This allows us to
                    // preserve the relative ordering of external stylesheets and
                    // inline style tags.
                    const styleTagUri = () => `${pageUrl}#style[${styles.length}]`;
                    const scriptTagUri = () => `${pageUrl}#script[${scripts.length}]`;
                    const getElementAttributes = (element) => element.getAttributeNames().map((attr) => {
                        const attrObject = {};
                        // We don't need href attr as we have already collected them
                        if (attr !== 'href') {
                            attrObject[attr] = element.getAttribute(attr);
                        }
                        return attrObject;
                    });
                    // Loop over all 'link',  'style' and 'script' elements in the document,
                    // in order of appearance. For each element, collect the URI
                    // of all the ones we're going to assess. For style elements,
                    // also extract each tag's content.
                    Array.from(document.querySelectorAll('link, style, script')).forEach((element) => {
                        if (isStylesheetLink(element)) {
                            const href = defragment(element.href);
                            const attr = getElementAttributes(element);
                            styleHrefs.push({ href, attr });
                        }
                        else if (isCssStyleTag(element)) {
                            const href = styleTagUri();
                            const text = element.innerHTML;
                            styles.push({ href, text });
                        }
                        else if (isJsScriptTag(element)) {
                            // Script loaded-type
                            if (element.src) {
                                const src = defragment(element.src);
                                const attr = getElementAttributes(element);
                                scriptSrcs.push({ src, attr });
                            } // Find inline scripts
                            else if (element.innerHTML) {
                                const text = element.innerHTML;
                                const src = scriptTagUri();
                                scripts.push({ src, text });
                            }
                        }
                    });
                    const cssInfo = { styleHrefs, styles };
                    const jsInfo = { scriptSrcs, scripts };
                    return { css: cssInfo, js: jsInfo };
                });
                debug('done');
                return {
                    css: {
                        info: documentInformation.css,
                        sheets
                    },
                    js: {
                        info: documentInformation.js,
                        scripts
                    }
                };
            }
            catch (error) {
                util.log(`Error: Assets collect return message: ${error.message}`);
                return undefined;
            }
        });
    }
}
exports.default = CollectAssets;
