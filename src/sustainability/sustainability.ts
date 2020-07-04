import Connection from '../connection/connection';
import Commander from '../commander/commander';
import {PageContext, AuditSettings} from '../types';
import {LaunchOptions, Browser, Page} from 'puppeteer';

import * as util from '../utils/utils';
import {Report} from '../types/audit';

export default class Sustainability {
	public static async audit(
		url: string,
		settings?: AuditSettings
	): Promise<Report> {
		const sustainability = new Sustainability();
		let browser: Browser | undefined;
		let page: Page;

		try {
			if (!settings?.page) {
				browser =
					settings?.browser ??
					(await sustainability.startNewConnectionAndReturnBrowser(
						settings?.launchSettings
					));
				page = await browser.newPage();
			} else {
				page = settings.page;
			}

			try {
				const pageContext = {page, url};
				const report = await sustainability.handler(pageContext, settings);
				return report;
			} catch (error) {
				throw new Error(`Error: Audit failed with message: ${error.message}`);
			} finally {
				await page.close();

			}
		} catch (error) {
			throw new Error(`Error: Failed to launch page: ${error.message}`);
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

	private async handler(pageContextRaw: PageContext, settings?: AuditSettings) {
		const startTime = Date.now();

		const projectId = settings?.id ?? util.generate();
		const {url} = pageContextRaw;
		const page = await Commander.setUp(
			pageContextRaw,
			settings?.connectionSettings
		);

		const pageContext = {...pageContextRaw, page};

		// @ts-ignore allSettled lacks typescript support
		const results = await Promise.allSettled([
			Commander.navigate(pageContext),
			Commander.asyncEvaluate(pageContext)
		]);

		const resultsParsed = util.parseAllSettled(results, true);
		const audits = util.groupAudits(resultsParsed);
		const globalScore = util.computeScore(audits);

		const meta = {
			id: projectId,
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
