import {Collect} from './collect';
import { PageContext } from '../types/cluster-settings';

export class CollectJs extends Collect {
	private static collectId:string='jscollect'
	static get id(){
		return this.collectId
	}
	static async collect(pageContext: PageContext) {
		const {page} = pageContext;
		const assets: any[] = [];

		page.on('response', async (response: any) => {
			const url = response.url();
			const resourceType = response.request().resourceType();
			if (resourceType === 'script') {
				const text = await response.text();
				const script = {
					url,
					text
				};

				assets.push(script);
			}
		});
	}
}
