"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const audit_1 = require("./audit");
const util = require("../utils/utils");
/**
 * Test with https://mathiasbynens.be/demo/img-loading-lazy
 */
const debug = util.debugGenerator('UsesLazyLoading Audit');
class UsesLazyLoadingAudit extends audit_1.default {
    static get meta() {
        return {
            id: 'lazyloading',
            title: 'Use lazy loading on media assets',
            failureTitle: `Don’t use lazy loading on media assets`,
            description: 'Lazy loading is a powerful feature. It instructs the browser not to download an asset until an specific event happens. Now it is natively supported on HTML on img and iframe elements. <a href="https://developer.mozilla.org/en-US/docs/Web/Performance/Lazy_loading">More info</a>.',
            category: 'design',
            collectors: ['transfercollect', 'imagescollect']
        };
    }
    static audit(traces) {
        const isAuditApplicable = () => {
            if (!traces.media.images.length)
                return false;
            if (!traces.media.images.some(image => !image.isVisible))
                return false;
            return true;
        };
        if (isAuditApplicable()) {
            debug('running');
            const score = Number(traces.lazyImages.length > 0);
            const meta = util.successOrFailureMeta(UsesLazyLoadingAudit.meta, score);
            debug('done');
            return {
                meta,
                score,
                scoreDisplayMode: 'binary'
            };
        }
        debug('skipping non applicable audit');
        return {
            meta: util.skipMeta(UsesLazyLoadingAudit.meta),
            scoreDisplayMode: 'skip'
        };
    }
}
exports.default = UsesLazyLoadingAudit;
