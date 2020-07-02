import Connection from '../connection/connection';
import Commander from '../commander/commander';
import {PageContext, AuditSettings} from '../types';
import {log} from '../utils/utils';
import {LaunchOptions, Browser} from 'puppeteer';

import * as util from '../utils/utils';

export default class Sustainability {
	public static async audit(url: string, settings?: AuditSettings) {
		const sustainability = new Sustainability();
		const browser =
			settings?.browser ??
			(await sustainability.startNewConnectionAndReturnBrowser(
				settings?.launchSettings
			));
		try {
			const page = settings?.page ?? (await browser?.newPage());

			try {
				const pageContext = {page, url};
				const report = await sustainability.handler(pageContext, settings);
				return report;
			} catch (error) {
				log(`Error: Audit failed with message: ${error.message}`);
			} finally {
				await page.close();
				process.exit(1)
			}
		} catch (error) {
			log(`Error: Failed to launch page: ${error.message}`);
		} finally {
			await browser?.close();
			process.exit(1)

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
			timing: [startTime, Date.now()]
		};
		return {
			globalScore,
			meta,
			audits
		};
	}
}
