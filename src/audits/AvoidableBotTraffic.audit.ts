import {Meta, Result, SkipResult} from '../types/audit';
import {Traces} from '../types/traces';
import Audit from './audit';
import * as util from '../utils/utils';
import {trace} from 'console';

export default class AvoidableBotTrafficAudit extends Audit {
	static get meta() {
		return {
			id: 'avoidablebottraffic',
			title: `Successfully handles bot traffic`,
			failureTitle: `Handle bot traffic`,
			description: `About 40% of current internet traffic and bandwidth is due to bots or web crawlers. Proper handling of robot.txt and <meta name="robots"> allow to control which content should be allowed for bots visiting your site and thus save precious resources. More <a href="https://support.google.com/webmasters/answer/6062596?hl=en">info</a>`,
			category: 'design',
			collectors: ['transfercollect']
		} as Meta;
	}

	static audit(traces: Traces): Result | SkipResult {
		const debug = util.debugGenerator('AvoidableBotTraffic Audit');
		debug('running');
		let errorMessage: string | undefined;

		try {
			const robotMetaTag = traces.metatag.filter(m => {
				return m.attr.some(
					attr => attr.hasOwnProperty('name') && attr.name === 'robots'
				);
			});

			// @ts-ignore flatMap
			const xRobotTag = traces.record.flatMap(r =>
				r.response.headers.hasOwnProperty('x-robots-tag')
					? r.response.headers['x-robots-tag']
					: []
			);
			const disallowRulesForAllUserAgents =
				traces?.robots?.agents['all']?.disallow;
			const agentsList = traces?.robots?.agents
				? Object.keys(traces?.robots?.agents)
				: [];
			const UAwithSpecificRules = agentsList.filter(agent => {
				traces.robots.agents[agent].disallow.length;
			});
			const passAudit = () => {
				if (robotMetaTag.length || xRobotTag.length) {
					return true;
				}

				if (!traces.robots)
					errorMessage = 'Consider handling bot traffic in a robots.txt file';

				if (disallowRulesForAllUserAgents?.length) return true;
				if (UAwithSpecificRules?.length) return true;

				return false;
			};

			const score = Number(passAudit());
			const meta = util.successOrFailureMeta(
				AvoidableBotTrafficAudit.meta,
				score
			);
			debug('done');

			return {
				meta,
				score,
				scoreDisplayMode: 'binary',
				...(errorMessage ? {errorMessage} : {})
			};
		} catch (error) {
			util.log(error);
			return {
				meta: util.skipMeta(AvoidableBotTrafficAudit.meta),
				scoreDisplayMode: 'skip',
				errorMessage: 'Failed to fetch robots.txt file'
			};
		}
	}
}
