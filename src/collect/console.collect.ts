import Collect from './collect';
import {ConsoleMessage} from 'puppeteer';
import {PageContext} from '../types';
import * as util from '../utils/utils';

const debug = util.debugGenerator('Console collect');
export default class CollectConsole extends Collect {
	collectId: SA.Audit.CollectorsIds = 'consolecollect';
	static get id() {
		return this.collectId;
	}

	static async collect(
		pageContext: PageContext
	): Promise<SA.Traces.CollectConsoleTraces | undefined> {
		debug('running');
		const {page} = pageContext;

		const results: SA.Traces.ConsoleMessage[] = [];

		page.on('console', async (message: ConsoleMessage) => {
			const information = {
				type: message.type(),
				text: message.text()
			};
			/**
			Console log client messages. Useful for debugging page evaluate
				for (let i = 0; i < message.args().length; ++i) {
					debug(`${i}: ${message.args()[i]}`);
				}

				*/
			results.push(information);
		});

		try {
			await util.safeNavigateTimeout(page, 'networkidle0', debug);
			return {
				console: results
			};
		} catch (error) {
			util.log(`Error: Console collect failed with message: ${error.message}`);
			return undefined;
		}
	}
}
