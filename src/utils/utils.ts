import * as Debug from 'debug';
import { Page } from 'puppeteer';
import { safeNavigateTimeout } from '../helpers/navigateTimeout';

export function debugGenerator(namespace: string): Debug.IDebugger {
    const debug = Debug(`sustainability: ${namespace}`);
    return debug;
}

const logToConsole = Debug('sustainability:log');
logToConsole.log = console.error.bind(console);

export function log(msg: string): void {
    logToConsole(msg);
}

export function toHexString(codePointArray:Array<number>):Array<string>{
    return codePointArray.map(codePoint=>'U+' + codePoint.toString(16).toUpperCase())
}

// Scroll function credits to nagy.zsolt.hun https://stackoverflow.com/questions/51529332/puppeteer-scroll-down-until-you-cant-anymore
export async function scrollFunction(page:Page, maxScrollInterval:number, debug?:CallableFunction):Promise<any>{
		await safeNavigateTimeout(page, 'load')
		if(debug){
			debug('running scroll function')
		}
		
		return page.evaluate(
			(maxScrollInterval) =>
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
				})
		, maxScrollInterval)
}