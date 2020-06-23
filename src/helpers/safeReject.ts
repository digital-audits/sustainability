import {Page, Request} from 'puppeteer';
import {Tracker} from '../types/cluster-settings';
import { log } from '../utils/utils';

export function safeReject(
	error: Error,
	tracker?: any
) {
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

	log(`Error: Navigation failed with message: ${error.message}`)
	
}

export function createTracker(page: Page): Tracker {
	const requests = new Set();
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
