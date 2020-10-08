import {PageContext} from '../types';
import {CollectorsIds} from '../types/audit';
import {ConnectionSettingsPrivate} from '../types/settings';
import {CollectRobotsTraces, RobotsFormat} from '../types/traces';
import Collect from './collect';
import * as utils from '../utils/utils';

// Inspired from https://github.com/b4dnewz/robots-parse/blob/master/src/parser.ts work

export default class CollectRobots extends Collect {
	collectId: CollectorsIds = 'performancecollect';
	static get id() {
		return this.collectId;
	}

	static async collect(
		pageContext: PageContext,
		settings: ConnectionSettingsPrivate
	): Promise<CollectRobotsTraces | undefined> {
		const debug = utils.debugGenerator('Robots Collect');
		debug('running');
		try {
			const patterns = {
				agents: /^([Uu]ser-[Aa]gent:) (.+)$/,
				allow: /^([Aa]llow:) (\/.+)$/,
				disallow: /^([Dd]isallow:) (\/.+)$/,
				host: /^([Hh]ost:) (.+)$/,
				sitemaps: /^([Ss]itemap:) (.+)$/
			};

			const results: RobotsFormat = {
				agents: {},
				allow: [],
				disallow: [],
				host: '',
				sitemaps: []
			};
			const {url} = pageContext;
			const hostname = new URL(url).hostname;
			const body = (await utils.fetchRobots(hostname)) || undefined;

			if (!body) {
				throw new Error('');
			}

			const lines = body.match(/[^\r\n]+/g) ?? [];
			let lastAgent = 'all';
			const getMatches = (regexp: RegExp, line: string) =>
				line.match(regexp)![2];

			lines.forEach(line => {
				line = line.trim();
				if (patterns.agents.test(line)) {
					const matches = getMatches(patterns.agents, line);
					lastAgent = matches === '*' ? 'all' : matches;
					results.agents[lastAgent] = {
						allow: [],
						disallow: []
					};
				}

				if (patterns.host.test(line)) {
					const matches = getMatches(patterns.host, line);
					results.host = matches;
				}

				if (patterns.allow.test(line)) {
					const matches = getMatches(patterns.allow, line);
					results.agents[lastAgent].allow.push(matches);

					if (!results.allow.includes(matches)) {
						results.allow.push(matches);
					}
				}

				if (patterns.disallow.test(line)) {
					const matches = getMatches(patterns.disallow, line);
					results.agents[lastAgent].disallow.push(matches);

					if (!results.disallow.includes(matches)) {
						results.disallow.push(matches);
					}
				}

				if (patterns.sitemaps.test(line)) {
					const matches = getMatches(patterns.sitemaps, line);
					if (matches?.length) results.sitemaps.push(matches);
				}
			});

			return {
				robots: results
			};
		} catch (error) {
			debug('Unable to parse robots.txt');
			return undefined;
		}
	}
}
