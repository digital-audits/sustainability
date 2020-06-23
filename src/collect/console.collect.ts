import {Collect} from './collect';
import {ConsoleMessage} from 'puppeteer';
import {safeNavigateTimeout} from '../helpers/navigateTimeout';
import { PageContext } from '../types/cluster-settings';
import { debugGenerator , log} from '../utils/utils';

const debug = debugGenerator('Console collect')

export class CollectConsole extends Collect {
	private static collectId:string='consolecollect'
	static get id(){
		return this.collectId
	}
	static async collect(pageContext: PageContext): Promise<any> {

		debug('running')
		const {page} = pageContext;

		const results: object[] = [];

		page.on('console', async (message: ConsoleMessage) => {
			const information = {
				type: message.type(),
				text: message.text()
			};

			/* If (options.debug) {
				for (let i = 0; i < message.args().length; ++i) {
					console.log(`${i}: ${message.args()[i]}`);
				}
			}
			*/

			results.push(information);
		});

		try {
			await safeNavigateTimeout(page, 'networkidle0', debug);
			console.log('done')
			return {
				console: results
			};
		} catch (error) {
			log(`Error: Console collect failed with message: ${error.message}`)
		}
	}
}
