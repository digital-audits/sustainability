import Audit from './audit';
import * as util from '../utils/utils';
import { Meta, Result, SkipResult } from '../types/audit';
import { Traces } from '../types/traces';

export default class UsesGreenServerAudit extends Audit {
	static get meta() {
		return {
			id: 'greenserver',
			title: `Server 100% renewable-powered`,
			failureTitle: `Server running on fossil fuels`,
			description: `It is important to make sure a server uses renewable-powered energy to host a website. Green hosting your website it is as easy as selecting a green web hosting provider.`,
			category: 'server',
			collectors: ['transfercollect', 'redirectcollect']
		} as Meta;
	}

	static async audit(traces: Traces): Promise<Result | SkipResult | undefined> {
		const debug = util.debugGenerator('UsesGreenServer Audit');
		debug('running');
		if (traces.server.energySource) {
			const { isGreen, hostedby } = traces.server.energySource;
			const score = Number(isGreen);

			const meta = util.successOrFailureMeta(UsesGreenServerAudit.meta, score);

			debug('done');
			return {
				meta,
				score,
				scoreDisplayMode: 'binary',
				...(hostedby
					? {
						extendedInfo: {
							value: { hostedby }
						}
					}
					: {})
			};
		}

		return {
			meta: util.skipMeta(UsesGreenServerAudit.meta),
			scoreDisplayMode: 'skip',
			errorMessage: 'Failed to fetch energy source of host'
		};
	}
}
