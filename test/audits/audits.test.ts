import CookieOptimisation from "../../src/audits/CookieOptimisation.audit"
import LeverageBrowserCachingAudit from "../../src/audits/LeverageBrowserCaching.audit"
import NoConsoleLogsAudit from "../../src/audits/NoConsoleLogs.audit"
import PixelEnergyEfficiencyAudit from "../../src/audits/PixelEnergyEfficiency.audit"
import ReactiveAnimationsAudit from "../../src/audits/ReactiveAnimations.audit"
import UsesCompressionAudit from "../../src/audits/UsesCompression.audit"
import UsesDarkModeAudit from "../../src/audits/UsesDarkMode.audit"
import UsesFontSubsettingAudit from "../../src/audits/UsesFontSubsetting.audit"
import { Result } from "../../src/types/audit"
import {
    Traces, Headers, ConsoleMessageFormat, AnimationsFormat, Sheets, SubfontFormat, InlineStyles,
    MediaFormat, InlineScripts, RedirectResponse, MetaTagFormat, RobotsFormat, Record
} from "../../src/types/traces"
import * as fetch from 'node-fetch';

import UsesGreenServerAudit from "../../src/audits/UsesGreenServer.audit"
import UsesHTTP2Audit from "../../src/audits/UsesHTTP2.audit"
import UsesLazyLoadingAudit from "../../src/audits/UsesLazyLoading.audit"
import UsesWebmVideoFormatAudit from "../../src/audits/UsesWebmVideoFormat.audit"
import UsesWebpImageFormatAudit from "../../src/audits/UsesWebpImageFormat.audit"
import AvoidInlineAssetsAudit from "../../src/audits/AvoidInlineAssets.audit"
import AvoidURLRedirectsAudit from "../../src/audits/AvoidURLRedirects.audits"
import AvoidableBotTrafficAudit from "../../src/audits/AvoidableBotTraffic.audit"
import CarbonFootprintAudit from "../../src/audits/CarbonFootprint.audit"
const traces = {
    hosts: ['localhost'],
    cookies: [
        {
            name: 'fatCookie',
            value: 'true',
            domain: 'localhost',
            expires: -1,
            httpOnly: false,
            path: '/',
            secure: false,
            session: true,
            size: 1030
        },
        {
            name: 'dupCookie',
            value: 'true',
            domain: 'localhost',
            expires: -1,
            httpOnly: false,
            path: '/',
            secure: false,
            session: true,
            size: 55
        },
        {
            name: 'dupCookie',
            value: 'true',
            domain: 'localhost',
            expires: -1,
            httpOnly: false,
            path: '/',
            secure: false,
            session: true,
            size: 55
        }
    ]
} as Traces

const skipTraces = {
    hosts: ['localhost'],
} as Traces

describe('CookieOptimisation Audit', () => {
    it('fails when has big sized cookies or/and duplicated cookies', () => {
        const auditResult = CookieOptimisation.audit(traces)
        expect(auditResult?.extendedInfo?.value.size).toEqual([{ name: 'fatCookie', size: 1030 }])
        expect(auditResult?.extendedInfo?.value.dup).toEqual(['dupCookie'])
    })
    it('extendedInfo only contains dup field when only duplicated cookies found', () => {
        const auditResult = CookieOptimisation.audit(
            {
                hosts:
                    ['localhost'],
                cookies: [
                    {
                        name: 'cookie',
                        value: 'true',
                        domain: 'localhost',
                        expires: -1,
                        httpOnly: false,
                        path: '/',
                        secure: false,
                        session: true,
                        size: 55
                    },
                    {
                        name: 'dupCookie',
                        value: 'true',
                        domain: 'localhost',
                        expires: -1,
                        httpOnly: false,
                        path: '/',
                        secure: false,
                        session: true,
                        size: 55
                    },
                    {
                        name: 'dupCookie',
                        value: 'true',
                        domain: 'localhost',
                        expires: -1,
                        httpOnly: false,
                        path: '/',
                        secure: false,
                        session: true,
                        size: 55
                    }

                ]
            } as Traces) as Result
        expect(auditResult?.extendedInfo?.value).toHaveProperty('dup')
    })
    it('extendedInfo only contains size field when only big sized cookies found', () => {
        const auditResult = CookieOptimisation.audit(
            {
                hosts:
                    ['localhost'],
                cookies: [
                    {
                        name: 'cookie',
                        value: 'true',
                        domain: 'localhost',
                        expires: -1,
                        httpOnly: false,
                        path: '/',
                        secure: false,
                        session: true,
                        size: 5555
                    }

                ]
            } as Traces) as Result

        expect(auditResult?.extendedInfo?.value).toHaveProperty('size')
    })
    it('ignores cross site cookies', () => {
        const auditResult = CookieOptimisation.audit(
            {
                hosts:
                    ['localhost'],
                cookies: [
                    {
                        name: 'ga-cookie',
                        value: 'true',
                        domain: 'google.com',
                        expires: -1,
                        httpOnly: false,
                        path: '/',
                        secure: false,
                        session: true,
                        size: 55
                    }
                ]
            } as Traces)
        const auditResultKeys = Object.keys(!auditResult)
        expect(auditResultKeys.includes('extendedInfo')).toBeFalsy()
    })
    it('big sized cookies dont include duplications if any', () => {
        const auditResult = CookieOptimisation.audit(
            {
                hosts:
                    ['localhost'],
                cookies: [
                    {
                        name: 'cookie',
                        value: 'true',
                        domain: 'localhost',
                        expires: -1,
                        httpOnly: false,
                        path: '/',
                        secure: false,
                        session: true,
                        size: 5555
                    },
                    {
                        name: 'cookie',
                        value: 'true',
                        domain: 'localhost',
                        expires: -1,
                        httpOnly: false,
                        path: '/',
                        secure: false,
                        session: true,
                        size: 5555
                    },

                ]
            } as Traces)
        expect(auditResult?.extendedInfo?.value.size).toEqual([{ name: 'cookie', size: 5555 }])

    })
    it('skips when no cookie are in traces', () => {
        const auditResult = CookieOptimisation.audit({ hosts: ['localhost'] } as Traces)
        expect(auditResult?.scoreDisplayMode).toEqual('skip')
    })
})

describe('LeverageBrowserCaching audit', () => {
    it('ignores cross site assets', () => {
        const auditResult = LeverageBrowserCachingAudit.audit({
            hosts: ['localhost'],
            record: [
                {
                    request: {
                        requestId: '1234',
                        url: new URL('http://cross-site.com/'),
                        resourceType: 'document',
                        method: 'GET',
                        headers: { "upgrade-insecure-requests": "1", "user-agent": "Mozilla/5.0 (Windows NT 10.0; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/68.0.3440.75 Safari/537.36" } as Headers,
                        timestamp: 16722928282,
                        protocol: 'h2'
                    },
                    response: {
                        remoteAddress: { ip: '127.0.0.1', port: 80 },
                        status: 200,
                        url: new URL('http://cross-site.com'),
                        headers: { "cache-control": "max-age=3600", "content-encoding": "gzip", "content-type": "text/html; charset=utf-8", "etag": "\"6f25c8912f4b42cfc3fca864f68b6d9987df90613d6e0085f493802eb977c926\"", "last-modified": "Fri, 24 Jul 2020 16:54:16 GMT", "strict-transport-security": "max-age=31556926", "accept-ranges": "bytes", "date": "Mon, 18 Jan 2021 18:37:01 GMT", "x-served-by": "cache-mad22063-MAD", "x-cache": "MISS", "x-cache-hits": "0", "x-timer": "S1610995021.741490,VS0,VE748", "vary": "x-fh-requested-host, accept-encoding", "content-length": "436" } as Headers,
                        uncompressedSize: { value: 123, units: 'bytes' },
                        gzipSize: { value: 0, units: 'bytes' },
                        timestamp: 16782829292,
                        fromServiceWorker: false
                    },
                    CDP: {
                        compressedSize: { value: 123, units: 'bytes' }
                    }
                }
            ],

        } as Traces)

        expect(auditResult.score).toEqual(1)
    })
    it('ignores non cacheable assets (resource type)', () => {
        const auditResult = LeverageBrowserCachingAudit.audit({
            hosts: ['localhost'],
            record: [
                {
                    request: {
                        requestId: '1234',
                        url: new URL('http://localhost/'),
                        resourceType: 'websocket',
                        method: 'GET',
                        headers: { "upgrade-insecure-requests": "1", "user-agent": "Mozilla/5.0 (Windows NT 10.0; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/68.0.3440.75 Safari/537.36" } as Headers,
                        timestamp: 16722928282,
                        protocol: 'h2'
                    },
                    response: {
                        remoteAddress: { ip: '127.0.0.1', port: 80 },
                        status: 301,
                        url: new URL('http://localhost'),
                        headers: { "cache-control": "max-age=3600", "content-encoding": "gzip", "content-type": "text/html; charset=utf-8", "etag": "\"6f25c8912f4b42cfc3fca864f68b6d9987df90613d6e0085f493802eb977c926\"", "last-modified": "Fri, 24 Jul 2020 16:54:16 GMT", "strict-transport-security": "max-age=31556926", "accept-ranges": "bytes", "date": "Mon, 18 Jan 2021 18:37:01 GMT", "x-served-by": "cache-mad22063-MAD", "x-cache": "MISS", "x-cache-hits": "0", "x-timer": "S1610995021.741490,VS0,VE748", "vary": "x-fh-requested-host, accept-encoding", "content-length": "436" } as Headers,
                        uncompressedSize: { value: 123, units: 'bytes' },
                        gzipSize: { value: 0, units: 'bytes' },
                        timestamp: 16782829292,
                        fromServiceWorker: false
                    },
                    CDP: {
                        compressedSize: { value: 123, units: 'bytes' }
                    }
                }
            ],

        } as Traces)
        expect(auditResult.score).toEqual(1)

    })
    it('ignores assets with implicit non caching policy in request headers', () => {
        const auditResult = LeverageBrowserCachingAudit.audit({
            hosts: ['localhost'],
            record: [
                {
                    request: {
                        requestId: '1234',
                        url: new URL('http://localhost/'),
                        resourceType: 'script',
                        method: 'GET',
                        headers: { "upgrade-insecure-requests": "1", "user-agent": "Mozilla/5.0 (Windows NT 10.0; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/68.0.3440.75 Safari/537.36" } as Headers,
                        timestamp: 16722928282,
                        protocol: 'h2'
                    },
                    response: {
                        remoteAddress: { ip: '127.0.0.1', port: 80 },
                        status: 200,
                        url: new URL('http://localhost'),
                        headers: { "cache-control": "no-cache", "content-encoding": "gzip", "content-type": "text/html; charset=utf-8", "etag": "\"6f25c8912f4b42cfc3fca864f68b6d9987df90613d6e0085f493802eb977c926\"", "last-modified": "Fri, 24 Jul 2020 16:54:16 GMT", "strict-transport-security": "max-age=31556926", "accept-ranges": "bytes", "date": "Mon, 18 Jan 2021 18:37:01 GMT", "x-served-by": "cache-mad22063-MAD", "x-cache": "MISS", "x-cache-hits": "0", "x-timer": "S1610995021.741490,VS0,VE748", "vary": "x-fh-requested-host, accept-encoding", "content-length": "436" } as Headers,
                        uncompressedSize: { value: 123, units: 'bytes' },
                        gzipSize: { value: 0, units: 'bytes' },
                        timestamp: 16782829292,
                        fromServiceWorker: false
                    },
                    CDP: {
                        compressedSize: { value: 123, units: 'bytes' }
                    }
                }
            ],

        } as Traces)

        expect(auditResult.score).toEqual(1)
    })
    it('ignores assets with invalid cache lifetime', () => {
        const auditResult = LeverageBrowserCachingAudit.audit({
            hosts: ['localhost'],
            record: [
                {
                    request: {
                        requestId: '1234',
                        url: new URL('http://localhost/'),
                        resourceType: 'script',
                        method: 'GET',
                        headers: { "upgrade-insecure-requests": "1", "user-agent": "Mozilla/5.0 (Windows NT 10.0; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/68.0.3440.75 Safari/537.36" } as Headers,
                        timestamp: 16722928282,
                        protocol: 'h2'
                    },
                    response: {
                        remoteAddress: { ip: '127.0.0.1', port: 80 },
                        status: 200,
                        url: new URL('http://localhost'),
                        headers: { "cache-control": "max-age=0", "content-encoding": "gzip", "content-type": "text/html; charset=utf-8", "etag": "\"6f25c8912f4b42cfc3fca864f68b6d9987df90613d6e0085f493802eb977c926\"", "last-modified": "Fri, 24 Jul 2020 16:54:16 GMT", "strict-transport-security": "max-age=31556926", "accept-ranges": "bytes", "date": "Mon, 18 Jan 2021 18:37:01 GMT", "x-served-by": "cache-mad22063-MAD", "x-cache": "MISS", "x-cache-hits": "0", "x-timer": "S1610995021.741490,VS0,VE748", "vary": "x-fh-requested-host, accept-encoding", "content-length": "436" } as Headers,
                        uncompressedSize: { value: 123, units: 'bytes' },
                        gzipSize: { value: 0, units: 'bytes' },
                        timestamp: 16782829292,
                        fromServiceWorker: false
                    },
                    CDP: {
                        compressedSize: { value: 123, units: 'bytes' }
                    }
                }
            ],

        } as Traces)
        expect(auditResult.score).toEqual(1)

    })
    it('ignores assets with cache hit probability higher than threshold', () => {
        const auditResult = LeverageBrowserCachingAudit.audit({
            hosts: ['localhost'],
            record: [
                {
                    request: {
                        requestId: '1234',
                        url: new URL('http://localhost/'),
                        resourceType: 'script',
                        method: 'GET',
                        headers: { "upgrade-insecure-requests": "1", "user-agent": "Mozilla/5.0 (Windows NT 10.0; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/68.0.3440.75 Safari/537.36" } as Headers,
                        timestamp: 16722928282,
                        protocol: 'h2'
                    },
                    response: {
                        remoteAddress: { ip: '127.0.0.1', port: 80 },
                        status: 200,
                        url: new URL('http://localhost'),
                        headers: { "cache-control": "max-age=31536000", "content-encoding": "gzip", "content-type": "text/html; charset=utf-8", "etag": "\"6f25c8912f4b42cfc3fca864f68b6d9987df90613d6e0085f493802eb977c926\"", "last-modified": "Fri, 24 Jul 2020 16:54:16 GMT", "strict-transport-security": "max-age=31556926", "accept-ranges": "bytes", "date": "Mon, 18 Jan 2021 18:37:01 GMT", "x-served-by": "cache-mad22063-MAD", "x-cache": "MISS", "x-cache-hits": "0", "x-timer": "S1610995021.741490,VS0,VE748", "vary": "x-fh-requested-host, accept-encoding", "content-length": "436" } as Headers,
                        uncompressedSize: { value: 123, units: 'bytes' },
                        gzipSize: { value: 0, units: 'bytes' },
                        timestamp: 16782829292,
                        fromServiceWorker: false
                    },
                    CDP: {
                        compressedSize: { value: 123, units: 'bytes' }
                    }
                }
            ],

        } as Traces)
        expect(auditResult.score).toEqual(1)
    })
    it('extendedInfo has totalWastedBytes and records field for failed audits', () => {
        const auditResult = LeverageBrowserCachingAudit.audit({
            hosts: ['localhost'],
            record: [
                {
                    request: {
                        requestId: '1234',
                        url: new URL('http://localhost/'),
                        resourceType: 'script',
                        method: 'GET',
                        headers: { "upgrade-insecure-requests": "1", "user-agent": "Mozilla/5.0 (Windows NT 10.0; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/68.0.3440.75 Safari/537.36" } as Headers,
                        timestamp: 16722928282,
                        protocol: 'h2'
                    },
                    response: {
                        remoteAddress: { ip: '127.0.0.1', port: 80 },
                        status: 200,
                        url: new URL('http://localhost'),
                        headers: { "cache-control": "max-age=", "content-encoding": "gzip", "content-type": "text/html; charset=utf-8", "etag": "\"6f25c8912f4b42cfc3fca864f68b6d9987df90613d6e0085f493802eb977c926\"", "last-modified": "Fri, 24 Jul 2020 16:54:16 GMT", "strict-transport-security": "max-age=31556926", "accept-ranges": "bytes", "date": "Mon, 18 Jan 2021 18:37:01 GMT", "x-served-by": "cache-mad22063-MAD", "x-cache": "MISS", "x-cache-hits": "0", "x-timer": "S1610995021.741490,VS0,VE748", "vary": "x-fh-requested-host, accept-encoding", "content-length": "436" } as Headers,
                        uncompressedSize: { value: 160000, units: 'bytes' },
                        gzipSize: { value: 0, units: 'bytes' },
                        timestamp: 16782829292,
                        fromServiceWorker: false
                    },
                    CDP: {
                        compressedSize: { value: 140000, units: 'bytes' }
                    }
                }
            ],

        } as Traces)
        expect(auditResult.score).toBeLessThan(1)
        expect(auditResult?.extendedInfo?.value.totalWastedBytes).toBeTruthy()
        expect(auditResult?.extendedInfo?.value.records).toBeTruthy()


    })
})

describe('NoConsoleLogs audit', () => {
    it('ignores duplicated console logs', () => {
        const auditResult = NoConsoleLogsAudit.audit({
            console: [
                { text: 'digital sustainability audits', type: 'text' },
                { text: 'digital sustainability audits', type: 'text' }

            ]
        } as Traces)

        expect(auditResult.score).toBe(0)
        expect(auditResult?.extendedInfo?.value.length).toBe(1)

    })

    it('passess successful audits', () => {
        const auditResult = NoConsoleLogsAudit.audit({
            console: [] as ConsoleMessageFormat[]
        } as Traces)
        expect(auditResult.score).toBe(1)

    })
    it('fails audits without console trace (error)', () => {
        const auditResult = NoConsoleLogsAudit.audit({
        } as Traces)
        expect(auditResult.score).toBe(0)

    })
})
describe('PixelEnergyEfficiency audit', () => {
    it('passess successful audits', () => {
        const auditResult = PixelEnergyEfficiencyAudit.audit(
            {
                screenshot: { power: 10 }
            } as Traces)
        expect(auditResult.score).toBe(1)
    })
})
describe('ReactiveAnimations audit', () => {
    it('skips when no animations in traces', () => {
        const auditResult = ReactiveAnimationsAudit.audit(
            {

            } as Traces)
        expect(auditResult.scoreDisplayMode).toEqual('skip')
    })
    it('passes successful audits', () => {
        const auditResult = ReactiveAnimationsAudit.audit(
            {
                animations: { notReactive: [] } as AnimationsFormat
            } as Traces) as Result
        expect(auditResult.score).toBe(1)
    })
    it('fails audits with non reactive animations', () => {
        const auditResult = ReactiveAnimationsAudit.audit(
            {
                animations: { notReactive: [{ name: 'anim', type: 'CSS', selector: '#myanim' }] }
            } as Traces) as Result
        expect(auditResult.score).toBe(0)
    })

})
describe('UsesCompression audit', () => {
    it('ignores records with invalid gzip size (0 bytes)', () => {
        const auditResult = UsesCompressionAudit.audit(
            {
                record: [
                    {
                        request: {},
                        response: {
                            uncompressedSize: { value: 1000, units: 'bytes' },
                            gzipSize: { value: 0, units: 'bytes' },
                            headers: { 'content-type': 'text/javascript' } as Headers,

                        },
                        CDP: {
                            compressedSize: { value: 1000, units: 'bytes' }
                        }
                    }
                ],
            } as Traces
        )
        expect(auditResult.score).toBe(1)
    })
    it('ignores records with invalid MIME types', () => {
        const auditResult = UsesCompressionAudit.audit(
            {
                record: [
                    {
                        request: {},
                        response: {
                            uncompressedSize: { value: 1500, units: 'bytes' },
                            gzipSize: { value: 700, units: 'bytes' },
                            headers: { 'content-type': "image/webp" } as Headers

                        },
                        CDP: {
                            compressedSize: { value: 1000, units: 'bytes' }
                        }
                    }
                ],
            } as Traces
        )
        expect(auditResult.score).toBe(1)
    })
    it('ignores records with gzip savings lower than threshold', () => {
        const auditResult = UsesCompressionAudit.audit(
            {
                hosts: ['localhost'],
                record: [
                    {
                        request: {
                            url: new URL('http://localhost')
                        },
                        response: {
                            uncompressedSize: { value: 250, units: 'bytes' },
                            gzipSize: { value: 200, units: 'bytes' },
                            headers: { 'content-type': 'text/javascript' } as Headers,

                        },
                        CDP: {
                            compressedSize: { value: 1000, units: 'bytes' }
                        }
                    }
                ],
            } as Traces
        )
        expect(auditResult.score).toBe(1)
    })
    it('ignores records already compressed', () => {
        const auditResult = UsesCompressionAudit.audit(
            {
                record: [
                    {
                        request: {},
                        response: {
                            uncompressedSize: { value: 2500, units: 'bytes' },
                            gzipSize: { value: 1500, units: 'bytes' },
                            headers: { 'content-type': 'text/javascript' } as Headers,

                        },
                        CDP: {
                            compressedSize: { value: 1800, units: 'bytes' }
                        }
                    }
                ],
            } as Traces
        )
        expect(auditResult.score).toBe(1)
    })
    it('ignores records with compressed size lower than gzipped size', () => {
        const auditResult = UsesCompressionAudit.audit(
            {
                record: [
                    {
                        request: {},
                        response: {
                            uncompressedSize: { value: 1000, units: 'bytes' },
                            gzipSize: { value: 800, units: 'bytes' },
                            headers: { 'content-type': 'text/javascript' } as Headers,

                        },
                        CDP: {
                            compressedSize: { value: 300, units: 'bytes' }
                        }
                    }
                ],
            } as Traces
        )
        expect(auditResult.score).toBe(1)
    })
    it('ignores cross-site requests', () => {
        const auditResult = UsesCompressionAudit.audit(
            {
                hosts: ['localhost'],
                record: [
                    {
                        request: {
                            url: new URL('https://www.google.com')
                        },
                        response: {
                            headers: { 'content-type': 'text/javascript' } as Headers,
                            uncompressedSize: { value: 1500, units: 'bytes' },
                            gzipSize: { value: 400, units: 'bytes' },

                        },
                        CDP: {
                            compressedSize: { value: 1400, units: 'bytes' }
                        }
                    }
                ],
            } as Traces
        )
        expect(auditResult.score).toBe(1)
    })
    it('reports low nginx gzip compression level', () => {
        const auditResult = UsesCompressionAudit.audit(
            {
                hosts: ['localhost'],
                record: [
                    {
                        request: {
                            url: new URL('http://localhost')
                        },
                        response: {
                            uncompressedSize: { value: 1000, units: 'bytes' },
                            gzipSize: { value: 400, units: 'bytes' },
                            headers: { 'server': 'NGINX', 'content-type': 'text/javascript' } as Headers

                        },
                        CDP: {
                            compressedSize: { value: 950, units: 'bytes' }
                        }
                    }
                ],
            } as Traces
        )
        expect(auditResult.score).toBe(0)
        expect(auditResult).toHaveProperty('errorMessage')
    })
    it('ignores repeated records', () => {
        const auditResult = UsesCompressionAudit.audit(
            {
                hosts: ['localhost'],
                record: [
                    {
                        request: {
                            url: new URL('http://localhost')
                        },
                        response: {
                            uncompressedSize: { value: 950, units: 'bytes' },
                            gzipSize: { value: 400, units: 'bytes' },
                            headers: { 'content-type': 'text/javascript' } as Headers

                        },
                        CDP: {
                            compressedSize: { value: 900, units: 'bytes' }
                        }
                    },
                    {
                        request: {
                            url: new URL('http://localhost')
                        },
                        response: {
                            uncompressedSize: { value: 950, units: 'bytes' },
                            gzipSize: { value: 400, units: 'bytes' },
                            headers: { 'content-type': 'text/javascript' } as Headers

                        },
                        CDP: {
                            compressedSize: { value: 900, units: 'bytes' }
                        }
                    }
                ],
            } as Traces
        )
        expect(auditResult.score).toBe(0)
        expect(auditResult?.extendedInfo?.value.length).toEqual(1)
    })
})

describe('UsesDarkMode audit', () => {
    it('passess successful audits', () => {
        const auditResult = UsesDarkModeAudit.audit(
            {
                screenshot: { hasDarkMode: true }
            } as Traces
        )
        expect(auditResult.score).toBe(1)
    })
})

describe('UsesFontSubsetting audit', () => {
    it('skips audits without css traces', () => {
        const auditResult = UsesFontSubsettingAudit.audit({
            css: {
                sheets: [] as Sheets[],
                info: {
                    styles: [] as InlineStyles[]
                }
            }
        } as Traces
        )
        expect(auditResult.scoreDisplayMode).toEqual('skip')
    })
    it('skips audits without font traces', () => {
        const auditResult = UsesFontSubsettingAudit.audit({
            css: {
                sheets: [
                    {
                        text: `@font-face {
                                font-family: myFirstFont;
                                src: url(sansation_light.woff);
                                }`,
                        url: 'http://localhost/styles.css'
                    }
                ],
                info: {
                    styles: [] as InlineStyles[]
                }
            },
            fonts: [] as SubfontFormat[]
        } as Traces)
        expect(auditResult.scoreDisplayMode).toEqual('skip')

    })

    it('skips audits without at least one resource of font type', () => {
        const auditResult = UsesFontSubsettingAudit.audit({
            record: [
                {
                    request: {
                        resourceType: 'script'
                    }
                }
            ],
            css: {

                sheets: [
                    {
                        text: `@font-face {
                                font-family: sensation;
                                src: url(sensation_light.woff);
                                }`,
                        url: 'http://localhost/styles.css'
                    }
                ],
                info: {
                    styles: [] as InlineStyles[]
                }
            },
            fonts: [
                {
                    name: 'sensation',
                    value: {
                        glyphs: ['U+32'],
                        weights: [300],
                        styles: ['light']
                    }

                }
            ],

        } as Traces)
        expect(auditResult.scoreDisplayMode).toEqual('skip')

    })
    it('passess successful audits', () => {
        const auditResult = UsesFontSubsettingAudit.audit({
            record: [
                {
                    request: {
                        resourceType: 'font'
                    }
                }
            ],
            css: {

                sheets: [
                    {
                        text: `@font-face {
                                font-family: sensation;
                                src: url(sensation_light.woff);
                                unicode-range:'U+32'
                                }`,
                        url: 'http://localhost/styles.css'
                    }
                ],
                info: {
                    styles: [] as InlineStyles[]
                }
            },
            fonts: [
                {
                    name: 'sensation',
                    value: {
                        glyphs: ['U+32'],
                        weights: [300],
                        styles: ['light']
                    }

                }
            ],

        } as Traces) as Result
        expect(auditResult.score).toEqual(1)
    })
    it('fails on audits which have not subset fonts and reports their name and the set of glyphs', () => {
        const auditResult = UsesFontSubsettingAudit.audit({
            record: [
                {
                    request: {
                        resourceType: 'font'
                    }
                }
            ],
            css: {

                sheets: [
                    {
                        text: `@font-face {
                                font-family: sensation;
                                src: url(sensation_light.woff);
                                }`,
                        url: 'http://localhost/styles.css'
                    }
                ],
                info: {
                    styles: [] as InlineStyles[]
                }
            },
            fonts: [
                {
                    name: 'sensation',
                    value: {
                        glyphs: ['U+32'],
                        weights: [300],
                        styles: ['light']
                    }

                }
            ],

        } as Traces) as Result
        expect(auditResult.score).toEqual(0)
        expect(auditResult.extendedInfo?.value[0].value).toHaveProperty('glyphs')
        expect(auditResult.extendedInfo?.value[0]).toHaveProperty('name')
    })

    it('fails on audits without font face property', () => {
        const auditResult = UsesFontSubsettingAudit.audit({
            record: [
                {
                    request: {
                        resourceType: 'font'
                    }
                }
            ],
            css: {

                sheets: [
                    {
                        text: `.center{
                            text-align:center
                        }`,
                        url: 'http://localhost/styles.css'
                    }
                ],
                info: {
                    styles: [] as InlineStyles[]
                }
            },
            fonts: [
                {
                    name: 'sensation',
                    value: {
                        glyphs: ['U+32'],
                        weights: [300],
                        styles: ['light']
                    }

                }
            ],

        } as Traces) as Result
        expect(auditResult.score).toEqual(0)
    })
    it('reports trace fontnames when those were not obtained when walking the css styles', () => {
        const auditResult = UsesFontSubsettingAudit.audit({
            record: [
                {
                    request: {
                        resourceType: 'font'
                    }
                }
            ],
            css: {

                sheets: [
                    {
                        text: `@font-face {
                                src: url(sensation_light.woff);
                                }`,
                        url: 'http://localhost/styles.css'
                    }
                ],
                info: {
                    styles: [] as InlineStyles[]
                }
            },
            fonts: [
                {
                    name: 'sensation',
                    value: {
                        glyphs: ['U+32'],
                        weights: [300],
                        styles: ['light']
                    }

                }
            ],

        } as Traces) as Result
        expect(auditResult.score).toEqual(0)
        expect(auditResult.extendedInfo?.value[0].name).toEqual('sensation')
    })
})
const fetchSpy = jest.spyOn(fetch, 'default')
describe('UsesGreenServer audit', () => {
    afterEach(() => {
        fetchSpy.mockClear()
    })
    it('passess on audits with green origin servers', async () => {
        fetchSpy.mockResolvedValueOnce(
            {
                status: 200,
                json: async () => ({
                    green: true,
                    hostedby: 'you-know'
                })
            } as fetch.Response);

        const auditResult = await UsesGreenServerAudit.audit({
            hosts: ['localhost'],
            record: [
                {
                    response: {
                        url: new URL('http://localhost')
                    }
                }
            ]
        } as Traces) as Result

        expect(auditResult.score).toEqual(1)

    })
    it('works when API response is fetched', async () => {
        fetchSpy.mockResolvedValueOnce(
            {
                status: 429,
                json: async () => ({
                    green: false,
                })
            } as fetch.Response);
        const auditResult = await UsesGreenServerAudit.audit({
            hosts: ['localhost'],
            record: [
                {
                    response: {
                        url: new URL('http://localhost')
                    }
                }
            ]
        } as Traces) as Result

        expect(auditResult.score).toEqual(0)

    })
    it('skips when API response is undefined', async () => {
        fetchSpy.mockRejectedValueOnce({ message: 'undefined' })
        const auditResult = await UsesGreenServerAudit.audit({
            hosts: ['localhost'],
            record: [
                {
                    response: {
                        url: new URL('http://localhost')
                    }
                }
            ]
        } as Traces)

        expect(auditResult?.scoreDisplayMode).toEqual('skip')
    })
    it('skips when API response has error', async () => {
        fetchSpy.mockResolvedValueOnce(
            {
                status: 501,
                json: async () => ({
                    error: 'Server internal error'
                })
            } as fetch.Response);
        const auditResult = await UsesGreenServerAudit.audit({
            hosts: ['localhost'],
            record: [
                {
                    response: {
                        url: new URL('http://localhost')
                    }
                }
            ]
        } as Traces)

        expect(auditResult?.scoreDisplayMode).toEqual('skip')
    })
    it('skips when a valid hostname was not found', async () => {
        const auditResult = await UsesGreenServerAudit.audit({
            hosts: ['localhost'],
            record: [
                {
                    response: {
                        url: new URL('http://random')
                    }
                }
            ]
        } as Traces)

        expect(auditResult?.scoreDisplayMode).toEqual('skip')
    })
})
describe('UsesHTTP2 audit', () => {
    it('ignores request without a protocol field', () => {
        const auditResult = UsesHTTP2Audit.audit({
            record: [
                {
                    request: {

                    }
                }
            ]
        } as Traces)
        expect(auditResult.score).toEqual(1)
    })
    it('ignores responses served from service workers', () => {
        const auditResult = UsesHTTP2Audit.audit({
            record: [
                {
                    request: {
                        protocol: 'h2',

                    },
                    response: {
                        fromServiceWorker: true
                    }
                },
            ]
        } as Traces)
        expect(auditResult.score).toEqual(1)


    })

    it('ignores cross site requests', () => {
        const auditResult = UsesHTTP2Audit.audit({
            hosts: ['localhost'],
            record: [
                {
                    request: {
                        url: new URL('http://remotehost'),
                        protocol: 'h1',

                    },
                    response: {
                        fromServiceWorker: false
                    }
                },
            ]
        } as Traces)
        expect(auditResult.score).toEqual(1)
    })
    it('passess records with a data request protocol', () => {
        const auditResult = UsesHTTP2Audit.audit({
            hosts: ['localhost'],
            record: [
                {
                    request: {
                        url: new URL('http://localhost'),
                        protocol: 'data',

                    },
                    response: {
                        fromServiceWorker: false
                    }
                },
            ]
        } as Traces)
        expect(auditResult.score).toEqual(1)
    })
    it('passess records with a h2 request protocol', () => {
        const auditResult = UsesHTTP2Audit.audit({
            hosts: ['localhost'],
            record: [
                {
                    request: {
                        url: new URL('http://localhost'),
                        protocol: 'h2',

                    },
                    response: {
                        fromServiceWorker: false
                    }
                },
            ]
        } as Traces)
        expect(auditResult.score).toEqual(1)
    })
    it('fails on non-h2 audits', () => {
        const auditResult = UsesHTTP2Audit.audit({
            hosts: ['localhost'],
            record: [
                {
                    request: {
                        url: new URL('http://localhost/script.js'),
                        protocol: 'h1',

                    },
                    response: {
                        fromServiceWorker: false
                    }
                }
            ]
        } as Traces)
        expect(auditResult.score).toEqual(0)

    })
    it('passess successful audits', () => {
        const auditResult = UsesHTTP2Audit.audit({
            hosts: ['localhost'],
            record: [
                {
                    request: {
                        url: new URL('http://localhost/script.js'),
                        protocol: 'h2',

                    },
                    response: {
                        fromServiceWorker: false
                    }
                },
                {
                    request: {
                        url: new URL('http://localhost/styles.css'),
                        protocol: 'h2',

                    },
                    response: {
                        fromServiceWorker: false
                    }
                }
            ]
        } as Traces)
        expect(auditResult.score).toEqual(1)
    })
})

describe('UsesLazyLoading audit', () => {
    it('skips audits with undefined lazymedia traces, ex: when page is unable to scroll', () => {
        const auditResult = UsesLazyLoadingAudit.audit({

        } as Traces)
        expect(auditResult.scoreDisplayMode).toEqual('skip')

    })
    it('skips audits without media traces', () => {
        const auditResult = UsesLazyLoadingAudit.audit({
            lazyMedia: {
                lazyImages: [] as string[],
                lazyVideos: [] as string[]
            },
            media: {
                images: [] as MediaFormat[],
                videos: [] as MediaFormat[]
            }
        } as Traces)
        expect(auditResult.scoreDisplayMode).toEqual('skip')

    })
    it('skips audits with non visible (under the fold) media traces', () => {
        const auditResult = UsesLazyLoadingAudit.audit({
            lazyMedia: {
                lazyImages: [] as string[],
                lazyVideos: [] as string[]
            },
            media: {
                images: [
                    {
                        isVisible: true,
                        src: 'http://localhost/cover.png'
                    }
                ] as MediaFormat[],
                videos: [] as MediaFormat[]
            }
        } as Traces)
        expect(auditResult.scoreDisplayMode).toEqual('skip')
    })
    it('passess successful audits', () => {
        const auditResult = UsesLazyLoadingAudit.audit({
            media: {
                images: [
                    {
                        isVisible: false,
                        src: 'http://localhost/cover.png',
                    }
                ] as MediaFormat[],
                videos: [] as MediaFormat[]
            },
            lazyMedia: {
                lazyImages: ['cover.png'],
                lazyVideos: [] as string[]
            }
        } as Traces) as Result
        expect(auditResult.score).toEqual(1)
    })
})
describe('UsesWebmVideoFormat audit', () => {

    it('skips audits without media video traces', () => {
        const auditResult = UsesWebmVideoFormatAudit.audit({
            media: {
                videos: [] as MediaFormat[]
            }
        } as Traces)
        expect(auditResult.scoreDisplayMode).toEqual('skip')
    })
    it('ignores videos without src atribute', () => {
        const auditResult = UsesWebmVideoFormatAudit.audit({
            lazyMedia: {
                lazyVideos: [] as string[]
            },
            media: {
                videos: [
                    {
                        widht: '1080',
                        height: '320'
                    }
                ] as MediaFormat[]
            }
        } as Traces)
        expect(auditResult.scoreDisplayMode).toEqual('skip')
    })
    it('uses lazy videos too', () => {
        const auditResult = UsesWebmVideoFormatAudit.audit({
            lazyMedia: {
                lazyVideos: ['http://localhost/lazyvideo.mp4']
            },
            media: {
                videos: [
                    {
                        src: 'http://localhost/myvideo.webm',
                        widht: '1080',
                        height: '320'
                    }
                ] as MediaFormat[]
            }
        } as Traces) as Result
        expect(auditResult.score).toEqual(0)
    })
    it('ignores repeated videos src', () => {
        const auditResult = UsesWebmVideoFormatAudit.audit({
            lazyMedia: {
                lazyVideos: [] as string[]
            },
            media: {
                videos: [
                    {
                        src: 'http://localhost/lazyvideo.mp4',
                        widht: '1080',
                        height: '320'
                    },
                    {
                        src: 'http://localhost/lazyvideo.mp4',
                        widht: '1080',
                        height: '320'
                    },

                ] as MediaFormat[]
            }
        } as Traces) as Result
        expect(auditResult.score).toEqual(0)
        expect(auditResult?.extendedInfo?.value.length).toEqual(1)
    })
    it('fails audits without all webm videos', () => {
        const auditResult = UsesWebmVideoFormatAudit.audit({
            lazyMedia: {
                lazyVideos: [] as string[]
            },
            media: {
                videos: [
                    {
                        src: 'http://localhost/lazyvideo.webm',
                        widht: '1080',
                        height: '320'
                    },
                    {
                        src: 'http://localhost/lazyvideo2.mp4',
                        widht: '1080',
                        height: '320'
                    }
                ] as MediaFormat[]
            }
        } as Traces) as Result

        expect(auditResult.score).toEqual(0)

    })
    it('passess successful audits', () => {
        const auditResult = UsesWebmVideoFormatAudit.audit({
            lazyMedia: {
                lazyVideos: ['http://localhost/lazyvideo3.webm'] as string[]
            },
            media: {
                videos: [
                    {
                        src: 'http://localhost/lazyvideo.webm',
                        widht: '1080',
                        height: '320'
                    },
                    {
                        src: 'http://localhost/lazyvideo2.webm',
                        widht: '1080',
                        height: '320'
                    }
                ] as MediaFormat[]
            }
        } as Traces) as Result

        expect(auditResult.score).toEqual(1)

    })
})

describe('UsesWebpImageFormat audit', () => {
    it('skips audits with undefined lazymedia traces, ex: when page is unable to scroll', () => {
        const auditResult = UsesWebpImageFormatAudit.audit({
            record: [
                {
                    request: {
                        url: new URL('http://localhost/script.js'),
                        protocol: 'h1',
                        resourceType: 'other'

                    },
                    response: {
                        fromServiceWorker: false
                    }
                }
            ]

        } as Traces)
        expect(auditResult.scoreDisplayMode).toEqual('skip')

    })
    it('ignores audits without media images', () => {
        const auditResult = UsesWebpImageFormatAudit.audit({
            lazyMedia: {
                lazyImages: [] as string[]
            },
            record: [
                {
                    request: {
                        resourceType: 'script'
                    },
                    response: {
                        url: new URL('http://localhost/script.js')
                    }
                }
            ]
        } as Traces)

        expect(auditResult.scoreDisplayMode).toEqual('skip')
    })
    it('ignores audits that dont have at least one image type of (png, jpg, gif, webp)', () => {
        const auditResult = UsesWebpImageFormatAudit.audit({
            lazyMedia: {
                lazyImages: [] as string[]
            },
            record: [
                {
                    request: {
                        resourceType: 'image'
                    },
                    response: {
                        url: new URL('http://localhost/spinner.svg')
                    }
                },

            ]
        } as Traces)

        expect(auditResult.scoreDisplayMode).toEqual('skip')
    })
    it('shortens base64 images and long image url', () => {
        const originalB64Image = 'data:image/jpeg;base64,/9j/4RiDRXhpZgAATU0AK4RiDRXhpZgAATU0AK4RiDRXhpZgAATU0AK'
        const auditResult = UsesWebpImageFormatAudit.audit({
            lazyMedia: {
                lazyImages: [] as string[]
            },
            record: [
                {
                    request: {
                        resourceType: 'image'
                    },
                    response: {
                        url: new URL(originalB64Image)
                    }
                },
                {
                    request: {
                        resourceType: 'image'
                    },
                    response: {
                        url: new URL('http://localhost/islong?=1&really-really-longimage.png')
                    }
                }
            ]
        } as Traces) as Result

        expect(auditResult.score).toEqual(0)
        expect(auditResult?.extendedInfo?.value.length).toEqual(2)
        expect(auditResult?.extendedInfo?.value[0].length).toBeLessThan(originalB64Image.length)

    })
    it('passess successful audits', () => {
        const auditResult = UsesWebpImageFormatAudit.audit({
            lazyMedia: {
                lazyImages: ['http://localhost/image2.svg'] as string[]
            },
            record: [
                {
                    request: {
                        resourceType: 'image'
                    },
                    response: {
                        url: new URL('http://localhost/image.webp')
                    }
                },
            ]
        } as Traces) as Result

        expect(auditResult.score).toEqual(1)
    })
})

describe('AvoidInlineAssets audit', () => {
    it('fails on audits with big sized inline css or js assets', () => {
        const auditResult = AvoidInlineAssetsAudit.audit({
            css: {
                info: {
                    styles: [
                        {
                            src: 'http://localhost#styles[0]',
                            text: '',
                            size: 3000
                        }
                    ],
                    styleHrefs: [{ src: 'http://localhost', attr: ['defer'] }]
                }
            },
            js: {
                info: {
                    scripts: [] as InlineScripts[]
                }
            }
        } as Traces)
        expect(auditResult.score).toEqual(0)
        expect(auditResult?.extendedInfo?.value.length).toEqual(1)
    })
    it('passess successful audits', () => {
        const auditResult = AvoidInlineAssetsAudit.audit({
            css: {
                info: {
                    styles: [
                        {
                            src: 'http://localhost#styles[0]',
                            text: '',
                            size: 1000
                        }
                    ],
                    styleHrefs: [{ src: 'http://localhost', attr: ['defer'] }]
                }
            },
            js: {
                info: {
                    scripts: [] as InlineScripts[]
                }
            }
        } as Traces)
        expect(auditResult.score).toEqual(1)

    })
})
describe('AvoidURLRedirects audit', () => {
    it('ignores empty redirects', () => {
        const auditResult = AvoidURLRedirectsAudit.audit({
            hosts: ['localhost'],
            redirect: [

            ] as RedirectResponse[]
        } as Traces)
        expect(auditResult.score).toEqual(1)
    })
    it('ignores cross site redirects', () => {
        const auditResult = AvoidURLRedirectsAudit.audit({
            hosts: ['localhost'],
            redirect: [
                {
                    url: 'http://remotehost',
                    redirectsTo: 'http://remotehost2',
                    requestId: '1'

                }
            ]
        } as Traces)
        expect(auditResult.score).toEqual(1)
    })
    it('fails on audits with redirects originated at the same host', () => {
        const auditResult = AvoidURLRedirectsAudit.audit({
            hosts: ['localhost'],
            redirect: [
                {
                    url: 'http://localhost',
                    redirectsTo: 'http://remotehost2',
                    requestId: '1'

                }
            ]
        } as Traces)
        expect(auditResult.score).toEqual(0)
        expect(auditResult?.extendedInfo?.value.length).toEqual(1)
    })
})
describe('AvoidableBotTraffic audit', () => {
    it('skips audits without robots traces', () => {
        const auditResult = AvoidableBotTrafficAudit.audit({
        } as Traces)
        expect(auditResult.scoreDisplayMode).toEqual('skip')
    })
    it('fails audits with poorly configured robots.txt file', () => {
        const auditResult = AvoidableBotTrafficAudit.audit({
            metatag: [] as MetaTagFormat[],
            record: [] as Record[],
            robots: {
                agents: {
                },
                allow: [],
                disallow: [],
                host: '',
                sitemaps: []
            } as RobotsFormat
        } as Traces) as Result

        expect(auditResult.score).toEqual(0)
    })
    it('passess successful audits with robots metatag or X-Robots-Tag header but warns to do otherwise ', () => {
        const auditResult = AvoidableBotTrafficAudit.audit({
            metatag: [
                {
                    attr: [
                        {
                            name: 'robots'
                        }
                    ]
                }
            ] as MetaTagFormat[],
            record: [
                {
                    response: {
                        headers: { 'content-type': 'text/plain', 'x-robots-tag': 'allow' } as Headers
                    }
                }
            ],
            robots: {
                agents: {},
                allow: [],
                disallow: [],
                host: '',
                sitemaps: []
            } as RobotsFormat
        } as Traces) as Result
        expect(auditResult.score).toEqual(1)
        expect(auditResult?.errorMessage).toBeTruthy()
    })
    it('passess successful audits with disallow all UA', () => {
        const auditResult = AvoidableBotTrafficAudit.audit({
            metatag: [] as MetaTagFormat[],
            record: [] as Record[],
            robots: {
                agents: {
                    all: {
                        allow: [],
                        disallow: ['/']
                    }
                },
                allow: [],
                disallow: [],
                host: '',
                sitemaps: []
            } as RobotsFormat
        } as Traces) as Result
        expect(auditResult.score).toEqual(1)
    })
    it('passess successful audits specific UA rules', () => {
        const auditResult = AvoidableBotTrafficAudit.audit({
            metatag: [] as MetaTagFormat[],
            record: [] as Record[],
            robots: {
                agents: {
                    'spider-bot': {
                        allow: [],
                        disallow: ['/']
                    }
                },
                allow: [],
                disallow: [],
                host: '',
                sitemaps: []
            } as RobotsFormat
        } as Traces) as Result
        expect(auditResult.score).toEqual(1)
    })
})
describe('CarbonFootprintAudit', () => {
    it('passess successful audits', async () => {
        fetchSpy.mockResolvedValueOnce({
            status: 200,
            json: async () => ({
                green: false,
            })
        } as fetch.Response)
        fetchSpy.mockResolvedValueOnce({
            status: 200,
            json: async () => ({
                green: true,
            })
        } as fetch.Response)
        fetchSpy.mockResolvedValueOnce({
            status: 200,
            json: async () => ({
                green: true,
            })
        } as fetch.Response)
        fetchSpy.mockRejectedValueOnce({ message: 'undefined' })

        const auditResult = await CarbonFootprintAudit.audit({
            record: [
                {
                    request: {
                        resourceType: 'script',

                    },
                    response: {
                        url: new URL('http://localhost/script.js'),
                        uncompressedSize: { value: 16000, units: 'bytes' }
                    },
                    CDP: {
                        compressedSize: { value: 12200, units: 'bytes' }
                    }
                },
                {
                    request: {
                        resourceType: 'script',

                    },
                    response: {
                        url: new URL('http://remotehost/main.js'),
                        uncompressedSize: { value: 12000, units: 'bytes' }
                    },
                    CDP: {
                        compressedSize: { value: 9000, units: 'bytes' }
                    }
                },
                {
                    request: {
                        resourceType: 'image',

                    },
                    response: {
                        url: new URL('http://remotehost/cover2.webp'),
                        uncompressedSize: { value: 12000, units: 'bytes' }
                    },
                    CDP: {
                        compressedSize: { value: 0, units: 'bytes' }
                    }
                },
                {
                    request: {
                        resourceType: 'image',

                    },
                    response: {
                        url: new URL('http://remotehost/'),
                        uncompressedSize: { value: 0, units: 'bytes' }
                    },
                    CDP: {
                        compressedSize: { value: 0, units: 'bytes' }
                    }
                }

            ]
        } as Traces) as Result

        expect(auditResult.score).toBe(1)
    })
    it('skips on audits with unknown error', async () => {
        const auditResult = await CarbonFootprintAudit.audit({
            record: [] as Record[]
        } as Traces)
        expect(auditResult.scoreDisplayMode).toEqual('skip')
    })

})




