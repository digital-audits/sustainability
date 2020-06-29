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
const settings_1 = require("../settings/settings");
const debug = util.debugGenerator('Transfer collect');
class CollectTransfer extends collect_1.default {
    constructor() {
        super(...arguments);
        this.collectId = 'transfercollect';
    }
    static get id() {
        return this.collectId;
    }
    static collect(pageContext) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                debug('running');
                const { page } = pageContext;
                const results = [];
                const protocol = [];
                const CDP = [];
                const lazyImages = [];
                const client = yield page.target().createCDPSession();
                yield client.send('Network.enable');
                client.on('Network.loadingFinished', (data) => {
                    if (data === null || data === void 0 ? void 0 : data.encodedDataLength) {
                        const { requestId, encodedDataLength } = data;
                        CDP.push({
                            requestId,
                            encodedDataLength
                        });
                    }
                });
                client.on('Network.responseReceived', (data) => {
                    if (data === null || data === void 0 ? void 0 : data.response) {
                        protocol.push({
                            protocol: data.response.protocol,
                            requestId: data.requestId
                        });
                    }
                });
                page.on('requestfinished', (request) => __awaiter(this, void 0, void 0, function* () {
                    var _a, _b;
                    const response = request.response();
                    let responseBody;
                    let uncompressedSize;
                    // Body can only be accessed for non-redirect responses
                    if (response) {
                        try {
                            responseBody = yield response.buffer();
                            uncompressedSize = {
                                value: responseBody.length,
                                units: 'bytes'
                            };
                        }
                        catch (error) {
                            const contentLengthFromResponseHeader = response.headers()['content-length'];
                            if (contentLengthFromResponseHeader) {
                                uncompressedSize = {
                                    value: +contentLengthFromResponseHeader,
                                    units: 'bytes'
                                };
                            }
                            else {
                                uncompressedSize = {
                                    value: 0,
                                    units: 'bytes'
                                };
                            }
                            debug('failed at redirect response');
                            util.log(`Error: Transfer collect failed with message: ${error.message}`);
                        }
                        //@ts-ignore
                        const requestId = request._requestId;
                        const information = {
                            request: {
                                requestId: requestId,
                                url: new URL(request.url()),
                                resourceType: request.resourceType(),
                                method: request.method(),
                                headers: request.headers(),
                                timestamp: Date.now(),
                                protocol: ((_a = protocol.find(p => p.requestId === requestId)) === null || _a === void 0 ? void 0 : _a.protocol)
                            },
                            response: {
                                remoteAddress: response.remoteAddress(),
                                status: response.status(),
                                url: new URL(response.url()),
                                fromServiceWorker: response.fromServiceWorker(),
                                headers: response.headers(),
                                uncompressedSize: uncompressedSize,
                                timestamp: Date.now()
                            },
                            CDP: {
                                compressedSize: {
                                    value: ((_b = CDP.find((r) => r.requestId === requestId)) === null || _b === void 0 ? void 0 : _b.encodedDataLength) || 0,
                                    units: 'bytes'
                                }
                            }
                        };
                        results.push(information);
                    }
                }));
                const requestListener = () => {
                    page.on('requestfinished', (request) => {
                        if (request.resourceType() === 'image') {
                            lazyImages.push(request.url());
                        }
                    });
                };
                yield util.safeNavigateTimeout(page, 'networkidle0', debug);
                requestListener();
                yield util.scrollFunction(page, settings_1.DEFAULT.CONNECTION_SETTINGS.maxScrollInterval, debug);
                debug('done scrolling');
                debug('done');
                return {
                    record: results,
                    lazyImages
                };
            }
            catch (error) {
                util.log(`Error: Transfer collect failed with message: ${error.message}`);
                return undefined;
            }
        });
    }
}
exports.default = CollectTransfer;
