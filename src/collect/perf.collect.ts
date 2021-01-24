import Collect from './collect';
import { PageContext } from '../types';
import * as util from '../utils/utils';
import { CollectMeta } from '../types/audit';
import { CollectPerformanceTraces } from '../types/traces';
import { Metrics } from 'puppeteer';
import { PrivateSettings } from '../types/settings';

export default class CollectPerformance extends Collect {
	static get meta() {
		return {
			id: 'performancecollect',
			debug: util.debugGenerator('Performance collect')
		} as CollectMeta;
	}

	static async collect(
		pageContext: PageContext,
		settings: PrivateSettings
	): Promise<CollectPerformanceTraces> {
		const { page } = pageContext;
		const debug = CollectPerformance.meta.debug;
		debug('running');
		await util.safeNavigateTimeout(page, 'load', settings.maxNavigationTime);
		const perf: Performance = await page.evaluate(() => performance.toJSON()) as Performance
		const metrics: Metrics = await page.metrics();
		const info = {
			perf,
			metrics
		};
		debug('done');
		return {
			performance: info
		};
	}
}
