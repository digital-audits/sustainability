"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const audit_1 = require("./audit");
const util = require("../utils/utils");
const debug = util.debugGenerator('UsesWebPImageFormat Audit');
class UsesWebpImageFormatAudit extends audit_1.default {
    static get meta() {
        return {
            id: 'webpimages',
            title: 'Use WebP image format',
            failureTitle: `Don’t use WebP image format`,
            description: 'WebP images provides superior lossless and lossy compression for images on the web. They maintain a low file size and high quality at the same time.  Although browser support is good (77%) you may use WebP images along with other fallback sources.',
            category: 'design',
            collectors: ['transfercollect', 'imagescollect']
        };
    }
    /**
     *
     * @param traces SA.DataLog.TransferTraces
     * Get image format using the MIME/type (header: content-type)
     * WebP should be used against PNG, JPG or GIF images
     */
    static audit(traces) {
        const isAuditApplicable = () => {
            if (!traces.media.images.length)
                return false;
            return true;
        };
        if (isAuditApplicable()) {
            debug('running');
            const auditUrls = new Set();
            //@ts-ignore flatMap
            const mediaImages = traces.media.images.flatMap(img => img.src ? [img.src] : []);
            mediaImages
                .concat(traces.lazyImages)
                .filter((url) => {
                if (auditUrls.has(url))
                    return false;
                if (url === null || url === void 0 ? void 0 : url.startsWith('data:')) {
                    auditUrls.add(url.slice(0, 10));
                    return false;
                }
                auditUrls.add(url.split('/').filter(Boolean).pop() || url);
                return true;
            });
            const score = Number(auditUrls.size === 0);
            const meta = util.successOrFailureMeta(UsesWebpImageFormatAudit.meta, score);
            debug('done');
            return Object.assign({ meta,
                score, scoreDisplayMode: 'binary' }, (auditUrls.size > 0 ? {
                extendedInfo: {
                    value: Array.from(auditUrls.values())
                }
            } : {}));
        }
        debug('skipping non applicable audit');
        return {
            meta: util.skipMeta(UsesWebpImageFormatAudit.meta),
            scoreDisplayMode: 'skip'
        };
    }
}
exports.default = UsesWebpImageFormatAudit;
