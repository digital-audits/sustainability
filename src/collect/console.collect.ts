import Collect from './collect';
import {PageContext} from '../types';
import * as util from '../utils/utils';
import {ConsoleMessage} from 'puppeteer';
import {CollectConsoleTraces, ConsoleMessageFormat} from '../types/traces';
import {CollectorsIds} from '../types/audit';
import {ConnectionSettingsPrivate} from '../types/settings';

const debug = util.debugGenerator('Console collect');
export default class CollectConsole extends Collect {
	collectId: CollectorsIds = 'consolecollect';
	static get id() {
		return this.collectId;
	}

	static async collect(
		pageContext: PageContext,
		settings: ConnectionSettingsPrivate
	): Promise<CollectConsoleTraces | undefined> {
		debug('running');
		const {page} = pageContext;

		const results: ConsoleMessageFormat[] = [];

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
			await util.safeNavigateTimeout(
				page,
				'networkidle0',
				settings.maxNavigationTime,
				debug
			);
			return {
				console: results
			};
		} catch (error) {
			util.log(`Error: Console collect failed with message: ${error.message}`);
			return undefined;
		}
	}
}
