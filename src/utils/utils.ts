import * as Debug from 'debug';
import {Page, Request, LoadEvent} from 'puppeteer';
import {
	PromiseAllSettledFulfilled,
	PromiseAllSettledRejected,
	Tracker
} from '../types';
import memoizee = require('memoizee');
import fetch from 'node-fetch';
import AbortController from 'abort-controller';
import {DEFAULT} from '../settings/settings';
import {getLogNormalScore, sum, groupBy} from '../bin/statistics';
import {
	AuditByFailOrPassOrSkip,
	Meta,
	SkipMeta,
	AuditReportFormat,
	SuccessOrFailureMeta,
	AuditsByCategory,
	Result
} from '../types/audit';

const escomplex = require('../bin/escomplex/src'); // From https://github.com/digital-audits/escomplex/tree/master

import * as sourceMap from 'source-map';
import {LOW_MAINTAINABILITY_THRESHOLD} from '../audits/Maintainability.audit';
import {
	Scripts,
	CodeMap,
	GreenAPIResponse,
	MapReadSources,
	CodeMapObject,
	EscomplexReportFormat,
	MaintainabilityFileReport,
	MaintainabilityFunctionInfo
} from '../types/traces';

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

// Scroll function credits to nagy.zsolt.hun https://stackoverflow.com/questions/51529332/puppeteer-scroll-down-until-you-cant-anymore
export async function scrollFunction(
	page: Page,
	maxScrollInterval: number,
	debug?: CallableFunction
): Promise<any> {
	if (debug) {
		debug('running scroll function');
	}

	return page.evaluate(
		maxScrollInterval =>
			new Promise(resolve => {
				let scrollTop = -1;
				const interval = setInterval(() => {
					window.scrollBy(0, 100);
					if (document.documentElement.scrollTop !== scrollTop) {
						scrollTop = document.documentElement.scrollTop;
						return;
					}

					clearInterval(interval);
					resolve();
				}, maxScrollInterval);
			}),
		maxScrollInterval
	);
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

export const fetchRequest = async (
	url: string
): Promise<GreenAPIResponse | undefined | any> => {
	const controller = new AbortController();
	const timeout = setTimeout(() => {
		controller.abort();
	}, DEFAULT.CONNECTION_SETTINGS.maxThrottle);
	try {
		const response = await fetch(url, {
			signal: controller.signal
		});

		const responseToJson = await response.json();

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

export const isGreenServerMem = memoizee(fetchRequest, {async: true});

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
		await page.waitForNavigation({waitUntil});
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
	controlPoints: {median: number; p10: number},
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
				category: {name: key, description: catDescription},
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
	const {title, failureTitle, collectors, ...output} = meta;

	if (hasFailed(score)) {
		return {title: failureTitle, ...output};
	}

	return {title, ...output};
}

export function skipMeta(meta: Meta): SkipMeta {
	return {id: meta.id, category: meta.category, description: meta.description};
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
		{pass: [], fail: [], skip: []} as AuditByFailOrPassOrSkip
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

export function getLowMaintainabilityModuleReports(
	input: CodeMapObject[],
	debug: CallableFunction
): MaintainabilityFileReport[] {
	// Analyse can take a array of sources with {path:,code:}
	const reports: EscomplexReportFormat[] = escomplex.analyse(input, {
		newmi: true,
		skipCalculation: true,
		noCoreSize: true,
		ignoreErrors: true
	}).reports;
	// @ts-ignore
	const lowMaintainabilityModuleReports: MaintainabilityFileReport[] = reports.flatMap(
		(v: EscomplexReportFormat) => {
			const isLowMaintainability =
				v.maintainability <= LOW_MAINTAINABILITY_THRESHOLD;
			return isLowMaintainability
				? [
						{
							path: v.path,
							maintainability: v.maintainability,
							...(v.functions.length > 0
								? {
										function: obtainComplexFunction(v)
								  }
								: {})
						}
				  ]
				: [];
		}
	);

	return lowMaintainabilityModuleReports;

	function obtainComplexFunction(
		report: EscomplexReportFormat
	): MaintainabilityFunctionInfo {
		const foosComplexity = report.functions.map(f => f.cyclomatic);
		const fooComplexIndex = foosComplexity.indexOf(Math.max(...foosComplexity));

		const functionObject = {
			name: report.functions[fooComplexIndex].name,
			line: report.functions[fooComplexIndex].sloc.logical,
			complexity: report.functions[fooComplexIndex].cyclomatic
		};

		return functionObject;
	}
}

export const readSources = async (
	input: sourceMap.RawSourceMap,
	debug?: CallableFunction
): Promise<MapReadSources> => {
	const consumer = await new sourceMap.SourceMapConsumer(input);

	const map: any = {};
	const code: any = [];
	let output: any = {};

	if (consumer.hasContentsOfAllSources()) {
		if (debug) {
			debug(`All sources were included in the sourcemap`);
		}

		consumer.sources.forEach(source => {
			const contents = consumer.sourceContentFor(source, false);
			if (contents) {
				output = {
					path: source,
					code: contents
				};

				code.push(output);
			}
		});
	} else if (debug) {
		debug('Not all sources were included in the sourcemap');
	}

	consumer.destroy();
	map.code = code;
	return map;
}; // Inspired from shuji, https://github.com/paazmaya/shuji

export const findMap = (
	script: Scripts,
	debug: CallableFunction
): CodeMap | boolean => {
	const FIND_SOURCE_FILE = /\/\/#\s*sourceMappingURL=([.\w]+map)/iu;
	const FIND_SOURCE_BASE64 = /\/\*?\/?#\s*sourceMappingURL=([.\w\-/=;:]*)base64,([\w]+=)/iu;
	const FIND_SOURCE_UENC = /\/\*?\/?#\s*sourceMappingURL=([.\w\-/=;:]+),([;:,.\-\w%]+)/iu;
	const input = script.text;
	if (input.match(FIND_SOURCE_BASE64)) {
		const sourceMappingMatch = FIND_SOURCE_BASE64.exec(input);
		if (sourceMappingMatch && sourceMappingMatch.length > 2) {
			const buf = Buffer.from(sourceMappingMatch[2], 'base64');
			debug(
				`Input ${script.url} contains Base64 of ${sourceMappingMatch[2].length} length`
			);
			return {type: 'base64', value: buf.toString('utf8')};
		}
	} else if (input.match(FIND_SOURCE_UENC)) {
		const sourceMappingMatch = FIND_SOURCE_UENC.exec(input);
		if (sourceMappingMatch && sourceMappingMatch.length > 2) {
			const buf = Buffer.from(sourceMappingMatch[2], 'ascii');
			debug(
				`Input ${script.url} contains URL encoded of ${sourceMappingMatch[2].length} length`
			);
			return {type: 'uenc', value: buf.toString('utf8')};
		}
	} else if (input.match(FIND_SOURCE_FILE)) {
		const sourceMappingMatch = FIND_SOURCE_FILE.exec(input);
		if (sourceMappingMatch && sourceMappingMatch.length > 1) {
			debug(`Input ${script.url} points to "${sourceMappingMatch[1]}"`);
			const urlLastSegment =
				script.url
					.split('/')
					.filter(Boolean)
					.pop() ?? undefined;
			return urlLastSegment
				? {
						type: 'relative',
						value: `${script.url.substring(
							script.url.search(new RegExp(urlLastSegment)),
							-1
						)}${sourceMappingMatch[1]}`
				  }
				: false;
		}
	}

	debug(`Input ${script.url} was not a map nor a code file`);

	return false;
};
