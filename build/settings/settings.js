"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const transfer_collect_1 = require("../collect/transfer.collect");
const failed_transfer_collect_1 = require("../collect/failed-transfer.collect");
const redirect_collect_1 = require("../collect/redirect.collect");
const console_collect_1 = require("../collect/console.collect");
const subfont_collect_1 = require("../collect/subfont.collect");
const assets_collect_1 = require("../collect/assets.collect");
const images_collect_1 = require("../collect/images.collect");
const UsesCompression_audit_1 = require("../audits/UsesCompression.audit");
const CarbonFootprint_audit_1 = require("../audits/CarbonFootprint.audit");
const UsesHTTP2_audit_1 = require("../audits/UsesHTTP2.audit");
const UsesGreenServer_audit_1 = require("../audits/UsesGreenServer.audit");
const UsesWebpImageFormat_audit_1 = require("../audits/UsesWebpImageFormat.audit");
const NoConsoleLogs_audit_1 = require("../audits/NoConsoleLogs.audit");
const UsesFontSubsetting_audit_1 = require("../audits/UsesFontSubsetting.audit");
const UsesLazyLoading_audit_1 = require("../audits/UsesLazyLoading.audit");
exports.DEFAULT = {
    LAUNCH_SETTINGS: {
        headless: true,
        timeout: 30 * 1000
    },
    CONNECTION_SETTINGS: {
        maxNavigationTime: 60 * 1000,
        maxScrollInterval: 30,
        emulatedDevice: {
            name: 'Desktop 1920x1080',
            userAgent: 'Mozilla/5.0 (Windows NT 10.0; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/68.0.3440.75 Safari/537.36',
            viewport: {
                width: 1920,
                height: 1080
            }
        },
        location: {
            name: 'Seattle',
            latitude: 47.6062,
            longitude: -122.3331,
            accuracy: 100
        }
    },
    CATEGORIES: {
        server: {
            description: 'Server aspects which are essential for online sustainability: green hosting, carbon footprint, data transfer.'
        },
        design: {
            description: 'Hands-on the website assets that convert code to user-friendly content: images, css stylesheets, scripts, fonts.'
        }
    },
    AUDITS: {
        collectors: [
            transfer_collect_1.default,
            failed_transfer_collect_1.default,
            redirect_collect_1.default,
            console_collect_1.default,
            subfont_collect_1.default,
            assets_collect_1.default,
            images_collect_1.default
        ],
        audits: [
            UsesCompression_audit_1.default,
            CarbonFootprint_audit_1.default,
            UsesHTTP2_audit_1.default,
            UsesGreenServer_audit_1.default,
            UsesWebpImageFormat_audit_1.default,
            NoConsoleLogs_audit_1.default,
            UsesFontSubsetting_audit_1.default,
            UsesLazyLoading_audit_1.default
        ]
    },
    REPORT: {
        scoringWeight: {
            server: 0.23076923076923078,
            js: 0.15384615384615385,
            css: 0.07692307692307693,
            html: 0.07692307692307693,
            fonts: 0.07692307692307693,
            media: 0.15384615384615385,
            transfer: 0.23076923076923078
        },
        scoring: {
            CF: { median: 4, p10: 1.2, name: 'Carbon Footprint' }
        }
    }
};
