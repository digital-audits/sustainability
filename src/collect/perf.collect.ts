import Collect from './collect';
import {PageContext} from '../types';
import * as util from '../utils/utils';
import { CollectorsIds } from '../types/audit';
import { CollectPerformanceTraces } from '../types/traces';
import { Metrics } from 'puppeteer';

export default class CollectPerformance extends Collect {
	collectId: CollectorsIds = 'performancecollect';
	static get id() {
		return this.collectId;
	}

	static async collect(
		pageContext: PageContext
	): Promise<CollectPerformanceTraces> {
		const {page} = pageContext;
		await util.safeNavigateTimeout(page, 'load');
		const perf: Performance = await page.evaluate(() => performance.toJSON());
		const metrics: Metrics = await page.metrics();
		const info = {
			perf,
			metrics
		};

		return {
			performance: info
		};
	}
}
