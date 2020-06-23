import {Page, NavigationOptions, LoadEvent} from 'puppeteer';
import {DEFAULT} from '../settings/settings';

export async function safeNavigateTimeout(
	page: Page,
	waitUntil: LoadEvent,
	debug?:CallableFunction,
	cb?: CallableFunction
) {

	if(debug){
		debug('Waiting for navigation to load')
	}
	let stopCallback: any = null;
	const navigate = async () => {
		await page.waitForNavigation({waitUntil})
		clearTimeout(stopNavigation);
	};

	const stopPromise = new Promise(x => (stopCallback = x));
	const stopNavigation = setTimeout(
		() => stopCallback(cb),
		DEFAULT.CONNECTION_SETTINGS.maxNavigationTime
	);
	return Promise.race([navigate(), stopPromise]);
}
