import {Audit} from './audit';
import {isGreenServerMem} from '../helpers/isGreenServer';
import {URL} from 'url';
import { debugGenerator } from '../utils/utils';

const debug = debugGenerator('UsesGreenServer Audit')
export class UsesGreenServerAudit extends Audit {
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
		traces: SA.DataLog.Traces
	): Promise<SA.Audit.Result | undefined> {
		debug('running')
		const {url} = traces;
		const initialHost = new URL(url).hostname;
		const hosts = new Set();
		hosts.add(initialHost);

		const redirect = traces.redirect?.find(
			record => new URL(record.url).hostname === initialHost
		)?.redirectsTo;

		if (redirect) {
			hosts.add(new URL(redirect).hostname);
		}

		const ipAddress = traces.record.find(record => {
			const hostname = new URL(record.response.url).hostname;
			return Boolean(Array.from(hosts.values()).includes(hostname));
		})?.response.remoteAddress.ip;

		debug('evaluating energy source')
		const response = await isGreenServerMem(ipAddress!);

		const {green, hostedby} = response!;

		const score = Number(green) || 0;
		const meta = Audit.successOrFailureMeta(UsesGreenServerAudit.meta, score);

		debug('done')
		return {
			meta,
			score,
			scoreDisplayMode: 'binary',
			extendedInfo: {
				value: {hostedby}
			}
		};
	}
}
