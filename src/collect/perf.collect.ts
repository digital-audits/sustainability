import Collect from './collect';
import { PageContext } from '../types/index';
import * as util from '../utils/utils'

export default class CollectPerformance extends Collect {
	collectId:SA.Audit.CollectorsIds='performancecollect'
	static get id(){
		return this.collectId
	}
	static async collect(pageContext: PageContext): Promise<SA.Traces.CollectPerformanceTraces> {
		const {page} = pageContext;
		await util.safeNavigateTimeout(page, 'load');
		const perf: Performance = await page.evaluate(() => performance.toJSON());
		const metrics: SA.Traces.Metrics= await page.metrics();
		const info = {
			perf,
			metrics
		};

		return {
			performance: info
		};
	}
}
