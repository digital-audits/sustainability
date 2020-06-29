import Collect from './collect';
import {PageContext} from '../types/index';
import * as util from '../utils/utils';
import {Request} from 'puppeteer'


const debug = util.debugGenerator('Collect assets')
export default class CollectAssets extends Collect {
	collectId:SA.Audit.CollectorsIds='assetscollect'
	static get id(){
		return this.collectId
	}
	static async collect(
		pageContext: PageContext
	): Promise<SA.Traces.CollectAssetsTraces | undefined> {
		try {
			debug('running')
			const {page} = pageContext;
			const sheets: SA.Traces.Sheets[] = [];
			const scripts: SA.Traces.Scripts[] = [];
			page.on('requestfinished', async (request: Request) => {
				const response = request.response()!;

				const url = response.url();
				const resourceType = response.request().resourceType();
				if (request.redirectChain().length === 0 && response.ok()) {
					if (resourceType === 'stylesheet') {
						const text = await response.text();
						const stylesheet = {
							url,
							text
						};

						sheets.push(stylesheet);
					}

					if (resourceType === 'script') {
						const text = await response.text();
						const script = {
							url,
							text
						};
						scripts.push(script);
					}
				}
			});

			await util.safeNavigateTimeout(page, 'load', debug);
			const documentInformation = await page.evaluate(() => {
				const styleHrefs: SA.Traces.Stylesheets[] = [];
				const scriptSrcs: SA.Traces.Scriptfiles[] = [];
				const styles: SA.Traces.InlineStyles[] = [];
				const scripts: SA.Traces.InlineScripts[] = [];

				const isCssStyleTag = (element: any) =>
					element.tagName === 'STYLE' &&
					(!element.type || element.type.toLowerCase() === 'text/css');

				const isJsScriptTag = (element: any) =>
					element.tagName === 'SCRIPT' &&
					(!element.type || element.type.toLowerCase() === 'text/javascript');

				const isStylesheetLink = (element: any) =>
					element.tagName === 'LINK' &&
					element.href &&
					element.rel.toLowerCase() === 'stylesheet' &&
					!element.href.toLowerCase().startsWith('data:') &&
					!element.href.toLowerCase().startsWith('blob:') &&
					element.media.toLowerCase() !== 'print';

				// #fragments are omitted from puppeteer's response.url(), so
				// we need to strip them from stylesheet links, otherwise the
				// hrefs won't always match when we check for missing ASTs.
				const defragment = (href: string) => href.split('#')[0];
				const pageUrl = defragment(window.location.href);
				// Create a unique identifier for each style tag by appending
				// an xpath-like fragment to the page URL.  This allows us to
				// preserve the relative ordering of external stylesheets and
				// inline style tags.
				const styleTagUri = () => `${pageUrl}#style[${styles.length}]`;
				const scriptTagUri = () => `${pageUrl}#script[${scripts.length}]`;

				const getElementAttributes = (element: any) =>
					element.getAttributeNames().map((attr: string) => {
						const attrObject: any = {};
						// We don't need href attr as we have already collected them
						if (attr !== 'href') {
							attrObject[attr] = element.getAttribute(attr);
						}

						return attrObject;
					});
				// Loop over all 'link',  'style' and 'script' elements in the document,
				// in order of appearance. For each element, collect the URI
				// of all the ones we're going to assess. For style elements,
				// also extract each tag's content.
				Array.from(document.querySelectorAll('link, style, script')).forEach(
					(element: any) => {
						if (isStylesheetLink(element)) {
							const href = defragment(element.href);
							const attr = getElementAttributes(element);
							styleHrefs.push({href, attr});
						} else if (isCssStyleTag(element)) {
							const href = styleTagUri();
							const text = element.innerHTML;
							styles.push({href, text});
						} else if (isJsScriptTag(element)) {
							// Script loaded-type
							if (element.src) {
								const src = defragment(element.src);
								const attr = getElementAttributes(element);

								scriptSrcs.push({src, attr});
							} // Find inline scripts
							else if (element.innerHTML) {
								const text = element.innerHTML;
								const src = scriptTagUri();
								scripts.push({src, text});
							}
						}
					}
				);

				const cssInfo = {styleHrefs, styles};
				const jsInfo = {scriptSrcs, scripts};
				return {css: cssInfo, js: jsInfo};
			});
			debug('done')
			return {
				css: {
					info: documentInformation.css,
					sheets
				},
				js: {
					info: documentInformation.js,
					scripts
				}
			};
		} catch (error) {
			util.log(`Error: Assets collect return message: ${error.message}`)
			return undefined;
		}
	}
}
