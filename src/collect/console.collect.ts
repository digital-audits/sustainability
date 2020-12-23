import Collect from './collect';
import {PageContext} from '../types';
import * as util from '../utils/utils';
import {ConsoleMessage} from 'puppeteer';
import {CollectConsoleTraces, ConsoleMessageFormat} from '../types/traces';
import {CollectMeta} from '../types/audit';
import {PrivateSettings} from '../types/settings';

export default class CollectConsole extends Collect {
	static get meta() {
		return {
			id: 'consolecollect',
			passContext: 'networkidle0',
			debug: util.debugGenerator('Console collect')
		} as CollectMeta;
	}

	static async collect(
		pageContext: PageContext,
		settings: PrivateSettings
	): Promise<CollectConsoleTraces | undefined> {
		const debug = CollectConsole.meta.debug;
		debug('running');
		try {
			const {page} = pageContext;
			const client = await page.target().createCDPSession();
			await client.send('Page.enable');
			const results: ConsoleMessageFormat[] = [];

			page.on('console', async (message: ConsoleMessage) => {
				const information = {
					type: message.type(),
					text: message.text()
				};
				/*
			Console log client messages. Useful for debugging page evaluate
			*/

				/*
			for (let i = 0; i < message.args().length; ++i) {
				debug(`${i}: ${message.args()[i]}`);
			}
			*/

				results.push(information);
			});
			if (settings.streams)
				await util.safeNavigateTimeout(
					page,
					'networkidle0',
					settings.maxNavigationTime,
					debug
				);

			debug('done');
			return {
				console: results
			};
		} catch (error) {
			util.log(`Error: Console collect failed with message: ${error.message}`);
			return undefined;
		}
	}
}
