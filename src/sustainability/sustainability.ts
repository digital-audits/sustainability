import Connection from '../connection/connection';
import Commander from '../commander/commander';
import { DEFAULT } from '../settings/settings';
import { PageContext, AuditSettings } from '../types';
import { LaunchOptions, Browser, Page, LoadEvent } from 'puppeteer';

import * as util from '../utils/utils';
import { Report } from '../types/audit';
import { auditStream } from './stream';

const debug = util.debugGenerator('Sustainability');
export default class Sustainability {
	/**
	 * A readable stream of audits to pipe from. Used in combination with streams option.
	 */
	public static auditStream = auditStream;
	/**
	 * Main method to start a new test on a given url. Returns a report.
	 */
	public static async audit(
		url: string,
		settings?: AuditSettings
	): Promise<Report> {
		const sustainability = new Sustainability();
		let browser: Browser | undefined;
		let page: Page;
		const comments: string[] = [];
		try {
			browser =
				settings?.browser ??
				(await sustainability.startNewConnectionAndReturnBrowser(
					settings?.launchSettings
				));

			let redirectURL = undefined;
			const isColdRun = settings?.connectionSettings?.coldRun ?? DEFAULT.CONNECTION_SETTINGS.coldRun
			if (isColdRun) {
				redirectURL = await sustainability.spawnColdRun(browser, url)
			}

			if (redirectURL) {
				comments.push(
					`Warning: The tested URL (${url}) was redirected to (${redirectURL}). Please, next time test the second URL directly.`
				);
				url = redirectURL;
			}

			page = await browser.newPage();
			const isTelemetryEnabled = settings?.connectionSettings?.telemetry ?? DEFAULT.CONNECTION_SETTINGS.telemetry
			let report = {} as Report
			try {
				const pageContext = { page, url };
				report = await sustainability.handler(pageContext, settings);
				if (comments.length) report.comments = comments;
				return report;
			} catch (error) {
				throw new Error(`Error: Test failed with message: ${error.message}`);
			} finally {
				await page.close();
				if (isTelemetryEnabled && Object.keys(report).length)
					await util.sendTelemetry(report)
			}
		} catch (error) {
			throw new Error(`Error: ${error.message}`);
		} finally {
			if (browser) {
				await browser.close();
			}
		}
	}

	private async startNewConnectionAndReturnBrowser(
		settings?: LaunchOptions
	): Promise<Browser> {
		const browser = await Connection.setUp(settings);
		return browser;
	}

	private async spawnColdRun(browser: Browser, url: string): Promise<string | undefined> {
		const coldRunPage = await browser.newPage();
		await coldRunPage.setRequestInterception(true);
		await coldRunPage.setJavaScriptEnabled(false);
		async function handleRequest(request: any, resolve: any) {
			if (request.isNavigationRequest() && request.redirectChain().length) {
				const redirectURL = request.url();
				request.abort();
				resolve(redirectURL);
			} else {
				request.continue();
			}
		}

		const redirectURLPromise = new Promise<string | undefined>(
			async resolve => {
				coldRunPage.on('request', request => handleRequest(request, resolve));
				debug('Starting cold run and looking for URL redirects');
			}
		);
		let redirectURL: string | undefined;
		const coldPageContext = { page: coldRunPage, url };
		await Promise.race([
			redirectURLPromise.then(v => (redirectURL = v)),
			util.navigate(coldPageContext, 'networkidle0', debug, true)
		]);

		return redirectURL
	}

	private async handler(
		pageContextRaw: PageContext,
		settings?: AuditSettings
	): Promise<Report> {
		const startTime = Date.now();
		const { url } = pageContextRaw;
		const page = await Commander.setUp(pageContextRaw, settings);
		const pageContext = { ...pageContextRaw, page };
		// @ts-ignore allSettled lacks typescript support
		const results = await Promise.allSettled([
			util.navigate(
				pageContext,
				'networkidle0',
				debug,
				false,
				settings?.connectionSettings
			),
			Commander.evaluate(pageContext)
		]);

		page.removeAllListeners();
		if (settings?.connectionSettings?.streams) {
			debug('Done streaming audits');
			Sustainability.auditStream.push(null);
		}

		const resultsParsed = util.parseAllSettled(results, true);
		const audits = util.groupAudits(resultsParsed);
		const globalScore = util.computeScore(audits);

		const meta = {
			url,
			timing: [new Date(startTime).toISOString(), Date.now() - startTime]
		};
		return {
			globalScore,
			meta,
			audits
		};
	}
}
