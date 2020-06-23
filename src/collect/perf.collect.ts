import {Collect} from './collect';
import {safeNavigateTimeout} from '../helpers/navigateTimeout';

export class CollectPerformance extends Collect {
	private static collectId:string='performancecollect'
	static get id(){
		return this.collectId
	}
	static async collect(passContext: any): Promise<any> {
		const {page} = passContext;
		await safeNavigateTimeout(page, 'load');
		const perf = await page.evaluate(() => performance.toJSON());
		const metrics = await page.metrics();
		const info = {
			perf,
			metrics
		};

		return {
			performance: info
		};
	}
}
