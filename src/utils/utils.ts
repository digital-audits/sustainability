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
	Result
} from '../types/audit';
import {Record, Headers} from '../types/traces';

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
	debug: CallableFunction
): Promise<any> {
	debug('running scroll function');
	return page.evaluate(
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
					resolve();
				}, maxScrollInterval);
			}),
		maxScrollInterval
	);
}

export async function isPageAbleToScroll(page: Page) {
	return page.evaluate(
		() => document.body.scrollHeight > document.body.clientHeight
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

export const isGreenServerMem = memoizee(isGreenServer, {async: true});

export async function fetchRobots(
	hostname: string,
	secure = false
): Promise<string> {
	const controller = new AbortController();
	const timeout = setTimeout(() => {
		controller.abort();
	}, DEFAULT.CONNECTION_SETTINGS.maxThrottle + 15000);
	const url = `http${secure ? 's' : ''}://${hostname}/robots.txt`;
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
		url
			.split('/')
			.filter(Boolean)
			.pop() ?? url
	);
}

/**
 * 
 * All this is to obtain summary from traces, commented out at the moment
 
export function sleep(ms: number) {
	return new Promise((resolve) => setTimeout(resolve, ms));
  }

  		//@ts-ignore

export function getSummary(model, startTime, endTime) {

	let _aggregatedStatsKey = Symbol('aggregatedStats');
  
			//@ts-ignore

	function buildRangeStats(model, startTime, endTime) {
	  var aggregatedStats = {};
  
	  		//@ts-ignore

	  function compareEndTime(value, task) {
		return value < task.endTime() ? -1 : 1;
	  }
	  var mainThreadTasks = model.mainThreadTasks();
	  var taskIndex = mainThreadTasks.lowerBound(startTime, compareEndTime);
	  for (; taskIndex < mainThreadTasks.length; ++taskIndex) {
		var task = mainThreadTasks[taskIndex];
		if (task.startTime() > endTime)
		  break;
		if (task.startTime() > startTime && task.endTime() < endTime) {
		  // cache stats for top-level entries that fit the range entirely.
		  var taskStats = task[_aggregatedStatsKey];
		  if (!taskStats) {
			taskStats = {};
			_collectAggregatedStatsForRecord(task, startTime, endTime, taskStats);
			task[_aggregatedStatsKey] = taskStats;
		  }
		  for (var key in taskStats)
		  		//@ts-ignore

			aggregatedStats[key] = (aggregatedStats[key] || 0) + taskStats[key];
		  continue;
		}
		_collectAggregatedStatsForRecord(task, startTime, endTime, aggregatedStats);
	  }
	  var aggregatedTotal = 0;
	  for (var categoryName in aggregatedStats)
	  		//@ts-ignore

		aggregatedTotal += aggregatedStats[categoryName];
				//@ts-ignore

	  aggregatedStats['idle'] = Math.max(0, endTime - startTime - aggregatedTotal);
  
	  return aggregatedStats;
	}

			//@ts-ignore

	function _collectAggregatedStatsForRecord(record, startTime, endTime, aggregatedStats) {
		if (!record.endTime() || record.endTime() < startTime || record.startTime() > endTime)
		  return;
		var childrenTime = 0;
		var children = record.children() || [];
		for (var i = 0; i < children.length; ++i) {
		  var child = children[i];
		  if (!child.endTime() || child.endTime() < startTime || child.startTime() > endTime)
			continue;
		  childrenTime += Math.min(endTime, child.endTime()) - Math.max(startTime, child.startTime());
		  _collectAggregatedStatsForRecord(child, startTime, endTime, aggregatedStats);
		}
		var categoryName = eventStyle(record.traceEvent()).category.name;
		var ownTime = Math.min(endTime, record.endTime()) - Math.max(startTime, record.startTime()) - childrenTime;
		aggregatedStats[categoryName] = (aggregatedStats[categoryName] || 0) + ownTime;
	  }
	
	  class TimelineCategory {
		name:string
		title:string
		visible:boolean
		childColor:string
		color:string
		hidden:boolean
		constructor(name:string, title:string, visible:boolean, childColor:string, color:string) {
		  this.name = name;
		  this.title = title;
		  this.visible = visible;
		  this.childColor = childColor;
		  this.color = color;
		  this.hidden = false;
		}
	  }
	
	  class TimelineRecordStyle  {
		  title:string
		  category:any
		  hidden:boolean
		constructor(title:string, category:any, hidden=false) {
		  this.title = title;
		  this.category = category;
		  this.hidden = !!hidden;
		}
	  };
	
	  const Category = {
		Console: 'blink.console',
		UserTiming: 'blink.user_timing',
		LatencyInfo: 'latencyInfo'
	  };
	
	  const CATEGORIES = {
		loading: new TimelineCategory('loading', 'Loading', true, 'hsl(214, 67%, 74%)', 'hsl(214, 67%, 66%)'),
		scripting: new TimelineCategory('scripting', 'Scripting', true, 'hsl(43, 83%, 72%)', 'hsl(43, 83%, 64%) '),
		rendering: new TimelineCategory('rendering', 'Rendering', true, 'hsl(256, 67%, 76%)', 'hsl(256, 67%, 70%)'),
		painting: new TimelineCategory('painting', 'Painting', true, 'hsl(109, 33%, 64%)', 'hsl(109, 33%, 55%)'),
		gpu: new TimelineCategory('gpu', 'GPU', false, 'hsl(109, 33%, 64%)', 'hsl(109, 33%, 55%)'),
		other: new TimelineCategory('other', 'Other', false, 'hsl(0, 0%, 87%)', 'hsl(0, 0%, 79%)'),
		idle: new TimelineCategory('idle', 'Idle', false, 'hsl(0, 100%, 100%)', 'hsl(0, 100%, 100%)')
	  };
	
	  let EVENT_STYLES = {
		Task: new TimelineRecordStyle('Task', CATEGORIES['other']),
		Program: new TimelineRecordStyle('Other', CATEGORIES['other']),
		Animation: new TimelineRecordStyle('Animation', CATEGORIES['rendering']),
		EventDispatch: new TimelineRecordStyle('Event', CATEGORIES['scripting']),
		RequestMainThreadFrame: new TimelineRecordStyle('Request Main Thread Frame', CATEGORIES['rendering'], true),
		BeginFrame: new TimelineRecordStyle('Frame Start', CATEGORIES['rendering'], true),
		BeginMainThreadFrame: new TimelineRecordStyle('Frame Start (main thread)', CATEGORIES['rendering'], true),
		DrawFrame: new TimelineRecordStyle('Draw Frame', CATEGORIES['rendering'], true),
		HitTest: new TimelineRecordStyle('Hit Test', CATEGORIES['rendering']),
		ScheduleStyleRecalculation: new TimelineRecordStyle('Schedule Style Recalculation', CATEGORIES['rendering'], true),
		RecalculateStyles: new TimelineRecordStyle('Recalculate Style', CATEGORIES['rendering']),
		UpdateLayoutTree: new TimelineRecordStyle('Recalculate Style', CATEGORIES['rendering']),
		InvalidateLayout: new TimelineRecordStyle('Invalidate Layout', CATEGORIES['rendering'], true),
		Layout: new TimelineRecordStyle('Layout', CATEGORIES['rendering']),
		PaintSetup: new TimelineRecordStyle('Paint Setup', CATEGORIES['painting']),
		PaintImage: new TimelineRecordStyle('Paint Image', CATEGORIES['painting'], true),
		UpdateLayer: new TimelineRecordStyle('Update Layer', CATEGORIES['painting'], true),
		UpdateLayerTree: new TimelineRecordStyle('Update Layer Tree', CATEGORIES['rendering']),
		Paint: new TimelineRecordStyle('Paint', CATEGORIES['painting']),
		RasterTask: new TimelineRecordStyle('Rasterize Paint', CATEGORIES['painting']),
		ScrollLayer: new TimelineRecordStyle('Scroll', CATEGORIES['rendering']),
		CompositeLayers: new TimelineRecordStyle('Composite Layers', CATEGORIES['painting']),
		ParseHTML: new TimelineRecordStyle('Parse HTML', CATEGORIES['loading']),
		ParseAuthorStyleSheet: new TimelineRecordStyle('Parse Stylesheet', CATEGORIES['loading']),
		TimerInstall: new TimelineRecordStyle('Install Timer', CATEGORIES['scripting']),
		TimerRemove: new TimelineRecordStyle('Remove Timer', CATEGORIES['scripting']),
		TimerFire: new TimelineRecordStyle('Timer Fired', CATEGORIES['scripting']),
		XHRReadyStateChange: new TimelineRecordStyle('XHR Ready State Change', CATEGORIES['scripting']),
		XHRLoad: new TimelineRecordStyle('XHR Load', CATEGORIES['scripting']),
		['v8.compile']: new TimelineRecordStyle('Compile Script', CATEGORIES['scripting']),
		EvaluateScript: new TimelineRecordStyle('Evaluate Script', CATEGORIES['scripting']),
		['v8.parseOnBackground']: new TimelineRecordStyle('Parse Script', CATEGORIES['scripting']),
		MarkLoad: new TimelineRecordStyle('Load event', CATEGORIES['scripting'], true),
		MarkDOMContent: new TimelineRecordStyle('DOMContentLoaded event', CATEGORIES['scripting'], true),
		MarkFirstPaint: new TimelineRecordStyle('First paint', CATEGORIES['painting'], true),
		TimeStamp: new TimelineRecordStyle('Timestamp', CATEGORIES['scripting']),
		ConsoleTime: new TimelineRecordStyle('Console Time', CATEGORIES['scripting']),
		UserTiming: new TimelineRecordStyle('User Timing', CATEGORIES['scripting']),
		ResourceSendRequest: new TimelineRecordStyle('Send Request', CATEGORIES['loading']),
		ResourceReceiveResponse: new TimelineRecordStyle('Receive Response', CATEGORIES['loading']),
		ResourceFinish: new TimelineRecordStyle('Finish Loading', CATEGORIES['loading']),
		ResourceReceivedData: new TimelineRecordStyle('Receive Data', CATEGORIES['loading']),
		RunMicrotasks: new TimelineRecordStyle('Run Microtasks', CATEGORIES['scripting']),
		FunctionCall: new TimelineRecordStyle('Function Call', CATEGORIES['scripting']),
		GCEvent: new TimelineRecordStyle('GC Event', CATEGORIES['scripting']),
		MajorGC: new TimelineRecordStyle('Major GC', CATEGORIES['scripting']),
		MinorGC: new TimelineRecordStyle('Minor GC', CATEGORIES['scripting']),
		JSFrame: new TimelineRecordStyle('JS Frame', CATEGORIES['scripting']),
		RequestAnimationFrame: new TimelineRecordStyle('Request Animation Frame', CATEGORIES['scripting']),
		CancelAnimationFrame: new TimelineRecordStyle('Cancel Animation Frame', CATEGORIES['scripting']),
		FireAnimationFrame: new TimelineRecordStyle('Animation Frame Fired', CATEGORIES['scripting']),
		RequestIdleCallback: new TimelineRecordStyle('Request Idle Callback', CATEGORIES['scripting']),
		CancelIdleCallback: new TimelineRecordStyle('Cancel Idle Callback', CATEGORIES['scripting']),
		FireIdleCallback: new TimelineRecordStyle('Fire Idle Callback', CATEGORIES['scripting']),
		WebSocketCreate: new TimelineRecordStyle('Create WebSocket', CATEGORIES['scripting']),
		WebSocketSendHandshakeRequest: new TimelineRecordStyle('Send WebSocket Handshake', CATEGORIES['scripting']),
		WebSocketReceiveHandshakeResponse: new TimelineRecordStyle('Receive WebSocket Handshake', CATEGORIES['scripting']),
		WebSocketDestroy: new TimelineRecordStyle('Destroy WebSocket', CATEGORIES['scripting']),
		EmbedderCallback: new TimelineRecordStyle('Embedder Callback', CATEGORIES['scripting']),
		['Decode Image']: new TimelineRecordStyle('Image Decode', CATEGORIES['painting']),
		['Resize Image']: new TimelineRecordStyle('Image Resize', CATEGORIES['painting']),
		GPUTask: new TimelineRecordStyle('GPU', CATEGORIES['gpu']),
		LatencyInfo: new TimelineRecordStyle('Input Latency', CATEGORIES['scripting']),
		['ThreadState::performIdleLazySweep']: new TimelineRecordStyle('DOM GC', CATEGORIES['scripting']),
		['ThreadState::completeSweep']: new TimelineRecordStyle('DOM GC', CATEGORIES['scripting']),
		['BlinkGCMarking']: new TimelineRecordStyle('DOM GC', CATEGORIES['scripting']),
	  };
	
	  function eventStyle(event:any) {
		if (event.hasCategory(Category.Console) || event.hasCategory(Category.UserTiming)) {
		  return { title: event.name, category: CATEGORIES['scripting'] };
		}
		if (event.hasCategory(Category.LatencyInfo)) {
		  var prefix = 'InputLatency::';
		  var inputEventType = event.name.startsWith(prefix) ? event.name.substr(prefix.length) : event.name;
		  var displayName = 'foo';
		  // FIXME: fix inputEventDisplayName below
		  //var displayName = Timeline.TimelineUIUtils.inputEventDisplayName(
		  //    /** @type {!TimelineModel.TimelineIRModel.InputEvents}  (inputEventType));
		  return { title: displayName || inputEventType, category: CATEGORIES['scripting'] };
		}
		//@ts-ignore
		var result:any = EVENT_STYLES[event.name];
		if (!result) {
		  result = new TimelineRecordStyle(event.name, CATEGORIES['other'], true);
		  		//@ts-ignore

		  EVENT_STYLES[event.name] = result;
		}
		return result;
	  }


  return buildRangeStats(model, startTime, endTime);
}
*/
