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
const debug = util.debugGenerator('Collect images');
class CollectImages extends collect_1.default {
    constructor() {
        super(...arguments);
        this.collectId = 'imagescollect';
    }
    static get id() {
        return this.collectId;
    }
    static collect(pageContext) {
        return __awaiter(this, void 0, void 0, function* () {
            debug('running');
            const { page } = pageContext;
            const fetchImages = () => __awaiter(this, void 0, void 0, function* () {
                return yield page.evaluate(() => {
                    const isElementVisible = (el) => {
                        const bounding = el.getBoundingClientRect();
                        const isVisible = (0 < bounding.top && bounding.top < (window.innerHeight ||
                            document.documentElement.clientHeight)) || (0 < bounding.bottom && bounding.bottom < (window.innerHeight || document.documentElement.clientHeight));
                        return isVisible;
                    };
                    return Array.from(document.body.querySelectorAll('img')).map((img) => {
                        const attrObject = {};
                        attrObject.isVisible = isElementVisible(img);
                        img.getAttributeNames().forEach(name => {
                            attrObject[name] = img.getAttribute(name);
                        });
                        return attrObject;
                    });
                });
            });
            yield util.safeNavigateTimeout(page, 'load', debug);
            debug('Fetching document images');
            const images = yield fetchImages();
            debug('done');
            return {
                media: { images }
            };
        });
    }
}
exports.default = CollectImages;
