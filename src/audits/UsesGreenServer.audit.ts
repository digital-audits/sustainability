import Audit from './audit';
import * as util from '../utils/utils';

const debug = util.debugGenerator('UsesGreenServer Audit');
export default class UsesGreenServerAudit extends Audit {
	static get meta() {
		return {
			id: 'greenserver',
			title: `Server 100% renewable-powered`,
			failureTitle: `Server running on fossil fuels`,
			description: `It is important to make sure a server uses renewable-powered energy to host a website. Green hosting your website it is as easy as selecting a green web hosting provider.`,
			category: 'server',
			collectors: ['transfercollect', 'redirectcollect']
		} as SA.Audit.Meta;
	}

	static async audit(
		traces: SA.Traces.Traces
	): Promise<SA.Audit.Result | SA.Audit.SkipResult | undefined> {
		debug('running');
		const {hosts} = traces;
		const ipAddress = traces.record.find(record => {
			const recordUrl = record.response.url.hostname;
			return hosts.includes(recordUrl);
		})?.response.remoteAddress.ip;

		debug('evaluating energy source');
		const response = await util.isGreenServerMem(ipAddress!);

		if (response && !response.error) {
			const {green, hostedby} = response;
			const score = Number(green);

			const meta = util.successOrFailureMeta(UsesGreenServerAudit.meta, score);

			debug('done');
			return {
				meta,
				score,
				scoreDisplayMode: 'binary',
				...(hostedby
					? {
							extendedInfo: {
								value: {hostedby}
							}
					  }
					: {})
			};
		}

		debug(`failed to fetch response with error: ${response?.error}`);
		return {
			meta: util.skipMeta(UsesGreenServerAudit.meta),
			scoreDisplayMode: 'skip',
			errorMessage: 'Failed to fetch response body'
		};
	}
}
