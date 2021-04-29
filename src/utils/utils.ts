import * as Debug from 'debug';
import { Page, Request, LoadEvent } from 'puppeteer';
import {
	PageContext,
	PromiseAllSettledFulfilled,
	PromiseAllSettledRejected,
	Tracker
} from '../types';
import memoizee = require('memoizee');
import fetch from 'node-fetch';
import AbortController from 'abort-controller';
import {
	getLogNormalScore,
	sum,
	groupBy,
	linearInterpolation
} from '../bin/statistics';
import {
	AuditByFailOrPassOrSkip,
	Meta,
	SkipMeta,
	AuditReportFormat,
	SuccessOrFailureMeta,
	AuditsByCategory,
	Result,
	Report
} from '../types/audit';
import { Record, Headers } from '../types/traces';
import { DEFAULT } from '../settings/settings';
import { ConnectionSettings } from '../types/settings';
import { TELEMETRY_API_URL } from '../references/references';

export function debugGenerator(namespace: string): Debug.IDebugger {
	const debug = Debug(`sustainability: ${namespace}`);
	return debug;
}

const logToConsole = Debug('sustainability:log');
logToConsole.log = console.error.bind(console);

export function log(message: string): void {
	logToConsole(message);
}

export function toHexString(codePointArray: number[]): string[] {
	return codePointArray.map(
		codePoint => 'U+' + codePoint.toString(16).toUpperCase()
	);
}

// Scroll function adapted from nagy.zsolt.hun https://stackoverflow.com/questions/51529332/puppeteer-scroll-down-until-you-cant-anymore
export async function scrollFunction(
	page: Page,
	maxScrollInterval: number,
	debug: CallableFunction = debugGenerator('Testing')
): Promise<any> {
	debug('running scroll function');
	const ableToScroll = await isPageAbleToScroll(page);
	if (ableToScroll) {
		await Promise.race([
			page.evaluate(
				maxScrollInterval =>
					new Promise(resolve => {
						let scrollTop = -1;
						const interval = setInterval(() => {
							window.scrollBy(0, 100);
							const getScrollTop =
								window.pageYOffset ||
								document.documentElement.scrollTop ||
								document.body.scrollTop;
							if (getScrollTop !== scrollTop) {
								scrollTop = getScrollTop;
								return;
							}

							clearInterval(interval);
							resolve(undefined);
						}, maxScrollInterval);
					}),
				maxScrollInterval
			),
			new Promise(resolve =>
				setTimeout(
					() => resolve(undefined),
					DEFAULT.CONNECTION_SETTINGS.maxScrollWaitingTime
				)
			)
		]);
	}

	page.emit('scrollFinished');
	debug('done scrolling');
}

export async function isPageAbleToScroll(page: Page) {
	return page.evaluate(() => {
		const initialTopValue =
			window.pageYOffset ||
			document.documentElement.scrollTop ||
			document.body.scrollTop;

		window.scrollBy(0, 100);
		const finalTopValue =
			window.pageYOffset ||
			document.documentElement.scrollTop ||
			document.body.scrollTop;

		if (finalTopValue !== initialTopValue) {
			window.scrollBy(0, -100);
			return true;
		}

		return false;
	});
}

export async function navigate(
	pageContext: PageContext,
	waitUntil: LoadEvent | LoadEvent[],
	debug: CallableFunction,
	end = false,
	settings?: ConnectionSettings
) {
	const { page, url } = pageContext;
	try {
		// @ts-ignore private _id
		const pageId = page.mainFrame()._id;
		debug(`${pageId} Starting navigation to ${url}`);
		let stopCallback: any = null;
		const stopPromise = new Promise(x => (stopCallback = x));
		const navigateAndClearTimeout = async () => {
			await page.goto(url, {
				waitUntil,
				timeout: 0
			});
			clearTimeout(stopNavigation);
		};

		const stopNavigation = setTimeout(
			() =>
				stopCallback(
					debug(
						`Forced end of navigation for page ${pageId} because the URL surpassed the maxNavigationTime`
					)
				),
			settings?.maxNavigationTime ??
			DEFAULT.CONNECTION_SETTINGS.maxNavigationTime
		);
		await Promise.race([navigateAndClearTimeout(), stopPromise]);
		debug('Done navigation');
	} finally {
		if (end) {
			await page.evaluate(() => window.stop());
			await page.close();
		}
	}
}

export function parseAllSettled(
	data: Array<PromiseAllSettledRejected | PromiseAllSettledFulfilled>,
	audit?: boolean
): any {
	const parser = (
		res: PromiseAllSettledFulfilled | PromiseAllSettledRejected
	) => {
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

	return (
		result
			.filter(data => data)
			// @ts-ignore
			.flatMap((data: any) => {
				const isArray = Array.isArray(data);
				if (isArray) {
					return data.map((d: any) => d.value);
				}

				return data;
			})
	);
}

export function safeReject(error: Error, tracker?: Tracker) {
	if (tracker) {
		if (error.message.startsWith('Navigation timeout')) {
			const urls = tracker.urls();
			if (urls.length > 1) {
				error.message += `\nTracked URLs that have not finished: ${urls.join(
					', '
				)}`;
			} else if (urls.length > 0) {
				error.message += `\nFor ${urls[0]}`;
			}

			tracker.dispose();
		}
	}

	throw new Error(`Error: Navigation failed with message: ${error.message}`);
}

export function createTracker(page: Page): Tracker {
	const requests = new Set<Request>();
	const onStarted = (request: Request) => requests.add(request);
	const onFinished = (request: Request) => requests.delete(request);
	page.on('request', onStarted);
	page.on('requestfinished', onFinished);
	page.on('requestfailed', onFinished);
	return {
		urls: () => Array.from(requests).map((r: any) => r.url()),
		dispose: () => {
			page.removeListener('request', onStarted);
			page.removeListener('requestfinished', onFinished);
			page.removeListener('requestfailed', onFinished);
		}
	};
}

const GREEN_SERVER_API = 'http://api.thegreenwebfoundation.org/greencheck';

interface APIResponse {
	green: boolean;
	url: string;
	hostedby: string;
	hostedbywebsite: string;
	error?: string;
}
const isGreenServer = async (
	hostname: string
): Promise<APIResponse | undefined> => {
	const controller = new AbortController();
	const timeout = setTimeout(() => {
		controller.abort();
	}, DEFAULT.CONNECTION_SETTINGS.maxThrottle);
	const url = `${GREEN_SERVER_API}/${hostname}`;
	try {
		const response = await fetch(url, {
			signal: controller.signal
		});

		const responseToJson = await response.json() as undefined | APIResponse;

		return responseToJson;
	} catch (error) {
		log(
			`Error: Failed to fetch response from green server API. ${error.message} ${url}`
		);
		return await new Promise(resolve => resolve(undefined));
	} finally {
		clearTimeout(timeout);
	}
};

export const isGreenServerMem = memoizee(isGreenServer, { async: true });

export async function fetchRobots(
	host: string,
	secure = false
): Promise<string | undefined> {
	const controller = new AbortController();
	const timeout = setTimeout(() => {
		controller.abort();
	}, DEFAULT.CONNECTION_SETTINGS.maxThrottle + 15000);
	const url = `http${secure ? 's' : ''}://${host}/robots.txt`;
	try {
		const response = await fetch(url, {
			signal: controller.signal,
			redirect: 'follow'
		});

		if (!response.ok) {
			throw new Error(`${response.statusText}`);
		}

		const responseText = await response.text();

		return responseText;
	} catch (error) {
		log(`Error: Failed to fetch robots.txt ${error.message} ${url}`);
		return await new Promise(resolve => resolve(undefined));
	} finally {
		clearTimeout(timeout);
	}
}

export async function safeNavigateTimeout(
	page: Page,
	waitUntil: LoadEvent,
	maxNavigationTime: number,
	debug?: CallableFunction,
	cb?: CallableFunction
) {
	if (debug) {
		debug('Waiting for navigation to load');
	}

	let stopCallback: any = null;
	const navigate = async () => {
		await page.waitForNavigation({ waitUntil });
		clearTimeout(stopNavigation);
	};

	const stopPromise = new Promise(x => (stopCallback = x));
	const stopNavigation = setTimeout(() => stopCallback(cb), maxNavigationTime);
	return Promise.race([navigate(), stopPromise]);
}

/**
 * Credits to Google Lighthouse
 *
 * Computes a score between 0 and 1 based on the measured `value`. Score is determined by
 * considering a log-normal distribution governed by two control points (the 10th
 * percentile value and the median value) and represents the percentage of sites that are
 * greater than `value`.
 *
 */
export function computeLogNormalScore(
	controlPoints: { median: number; p10: number },
	value: number
): number {
	const percentile = getLogNormalScore(controlPoints, value);

	return clampTo2Decimals(percentile);
}

export const clampTo2Decimals = (value: number) =>
	Math.round(value * 100) / 100;

/**
 * @description Computes a global calculated as the average sum of category scores.
 */
export function computeScore(audits: any) {
	return Math.round(sum(audits.map((audit: any) => audit.score)) / 2);
}

export function groupAudits(list: Result[]): AuditsByCategory[] {
	const resultsGrouped = groupBy(list, (audit: Result) => audit.meta.category);
	const audits = Array.from(resultsGrouped.keys()).map(
		(key: 'server' | 'design') => {
			const groupByKey = resultsGrouped.get(key);
			const auditsByFailOrPassOrSkip = successOrFailureOrSkipAudits(groupByKey);
			const groupByKeyNonSkip = groupByKey.filter(
				(result: Result) => result.scoreDisplayMode !== 'skip'
			);
			const auditScoreRaw =
				sum(groupByKeyNonSkip.map((result: Result) => result.score)) /
				groupByKeyNonSkip.length;
			const auditScore = Math.round(auditScoreRaw * 100);
			const catDescription = DEFAULT.CATEGORIES[key].description;

			return {
				category: { name: key, description: catDescription },
				score: auditScore,
				audits: auditsByFailOrPassOrSkip
			};
		}
	);

	return audits;
}

export function successOrFailureMeta(
	meta: Meta,
	score: number
): SuccessOrFailureMeta {
	const { title, failureTitle, collectors, ...output } = meta;

	if (hasFailed(score)) {
		return { title: failureTitle, ...output };
	}

	return { title, ...output };
}

export function skipMeta(meta: Meta): SkipMeta {
	return { id: meta.id, category: meta.category, description: meta.description };
}

export function hasFailed(score: number) {
	if (score === 0 || score <= 0.49) {
		return true;
	}

	return false;
}

export function successOrFailureOrSkipAudits(
	audits: AuditReportFormat[]
): AuditByFailOrPassOrSkip {
	const out = audits.reduce(
		(object, v) => {
			const skipAudit = v.scoreDisplayMode === 'skip';
			(skipAudit
				? object.skip
				: hasFailed(v.score)
					? object.fail
					: object.pass
			).push(v);
			return object;
		},
		{ pass: [], fail: [], skip: [] } as AuditByFailOrPassOrSkip
	);

	return out;
}

export function removeQuotes(text: string): string {
	if (text.startsWith(`’`)) {
		return text.replace(/'/g, '');
	}

	if (text.startsWith('"')) {
		return text.replace(/"/g, '');
	}

	return text;
}

/**
 * Utils for LeverageBrowserCaching Audit
 */

export function getCacheHitProbability(maxAgeInSecs: number) {
	const RESOURCE_AGE_IN_HOURS_DECILES = [
		0,
		0.2,
		1,
		3,
		8,
		12,
		24,
		48,
		72,
		168,
		8760,
		Infinity
	];
	const maxAgeInHours = maxAgeInSecs / 3600;
	const upperDecileIndex = RESOURCE_AGE_IN_HOURS_DECILES.findIndex(
		decile => decile >= maxAgeInHours
	);

	// Clip the likelihood between 0 and 1
	if (upperDecileIndex === RESOURCE_AGE_IN_HOURS_DECILES.length - 1) return 1;
	if (upperDecileIndex === 0) return 0;

	// Use the two closest decile points as control points
	const upperDecileValue = RESOURCE_AGE_IN_HOURS_DECILES[upperDecileIndex];
	const lowerDecileValue = RESOURCE_AGE_IN_HOURS_DECILES[upperDecileIndex - 1];
	const upperDecile = upperDecileIndex / 10;
	const lowerDecile = (upperDecileIndex - 1) / 10;

	// Approximate the real likelihood with linear interpolation
	return linearInterpolation(
		lowerDecileValue,
		lowerDecile,
		upperDecileValue,
		upperDecile,
		maxAgeInHours
	);
}

export function computeCacheLifetimeInSeconds(
	headers: Headers,
	cacheControl: any
) {
	if (cacheControl?.['max-age'] !== undefined) {
		return cacheControl['max-age'];
	}

	const expiresHeaders = headers.expires;
	if (expiresHeaders) {
		const expires = new Date(expiresHeaders).getTime();
		// Invalid expires values MUST be treated as already expired
		if (!expires) return 0;
		return Math.ceil((expires - Date.now()) / 1000);
	}

	return null;
}

export function isCacheableAsset(record: Record) {
	const CACHEABLE_STATUS_CODES = new Set([200, 203, 206]);
	const NON_NETWORK_PROTOCOLS = ['blob', 'data', 'intent'];

	/** @type {Set<LH.Crdp.Network.ResourceType>} */
	const STATIC_RESOURCE_TYPES = new Set([
		'font',
		'image',
		'media',
		'script',
		'stylesheet'
	]);

	// It's not a request loaded over the network, caching makes no sense
	if (NON_NETWORK_PROTOCOLS.includes(record.request.protocol!)) return false;

	return (
		CACHEABLE_STATUS_CODES.has(record.response.status) &&
		STATIC_RESOURCE_TYPES.has(record.request.resourceType)
	);
}

export function shouldSkipRecord(headers: Headers, cacheControl: any) {
	// The HTTP/1.0 Pragma header can disable caching if cache-control is not set, see https://tools.ietf.org/html/rfc7234#section-5.4
	if (!cacheControl && (headers.pragma || '').includes('no-cache')) {
		return true;
	}

	// Ignore assets where policy implies they should not be cached long periods
	if (
		cacheControl &&
		(cacheControl['must-revalidate'] ||
			cacheControl['no-cache'] ||
			cacheControl['no-store'] ||
			cacheControl.private)
	) {
		return true;
	}

	return false;
}

export function getUrlLastSegment(url: string) {
	return (
		(url
			.split('/')
			.filter(Boolean)
			.pop() ?? url
		).split('?')[0]
	)
}

export function str2ab(string: string): ArrayBuffer {
	const buf = new ArrayBuffer(string.length * 2);
	const bufView = new Uint16Array(buf);
	for (let i = 0, stringLength = string.length; i < stringLength; i++) {
		bufView[i] = string.charCodeAt(i);
	}

	return buf;
}

function getReportObject(reqReport: Report) {
	const lastAuditDate = reqReport.meta.timing[0]
	const totalPasses = reqReport.audits[0].audits.pass.map(audit => audit.meta.id).concat(reqReport.audits[1].audits.pass.map(audit => audit.meta.id))
	const totalFails = reqReport.audits[0].audits.fail.map(audit => audit.meta.id).concat(reqReport.audits[1].audits.fail.map(audit => audit.meta.id))
	const totalSkips = reqReport.audits[0].audits.skip.map(audit => audit.meta.id).concat(reqReport.audits[1].audits.skip.map(audit => audit.meta.id))

	const serverAudits = reqReport.audits.find(audits => audits.category.name === 'server')!.audits
	const cfAuditType = Object.values(serverAudits).find((type: AuditReportFormat[]) => type.some(audit => audit.meta.id === 'carbonfootprint')).find((audit: AuditReportFormat) => audit.meta.id === 'carbonfootprint')

	return {
		url: reqReport.meta.url,
		lastAuditDate,
		date: reqReport.meta.timing[0],
		auditSource: 'npm',
		executionTime: reqReport.meta.timing[1],
		globalScore: reqReport.globalScore,
		serverScore: reqReport.audits[0].score,
		designScore: reqReport.audits[1].score,
		passes: totalPasses,
		fails: totalFails,
		skips: totalSkips,
		carbonf: +cfAuditType.extendedInfo.value.extra.carbonfootprint[0],
		transferSize: +cfAuditType.extendedInfo.value.extra.totalTransfersize[0]
	}
}

export async function sendTelemetry(body: any) {
	try {
		await fetch(TELEMETRY_API_URL, {
			headers: {
				'Content-Type': 'application/json'
			},
			method: 'POST',
			body: JSON.stringify({ report: getReportObject(body) })
		})
	} catch (error) {
		log(error)
	}
}