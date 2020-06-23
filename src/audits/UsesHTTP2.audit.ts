import {Audit} from './audit';
import {URL} from 'url';
import { debugGenerator } from '../utils/utils';

/**
 * @fileoverview Audit request in the same origin as host use HTTP2.0
 */

 const debug = debugGenerator('UsesHTTP2 Audit')
export class UsesHTTP2Audit extends Audit {
	static get meta() {
		return {
			id: 'useshttp2',
			title: 'Use HTTP2',
			failureTitle: `Don’t use HTTP2`,
			description: `HTTP2 provides advantages such as:
            multiplexing, server push, binary headers and increased security.`,
			category: 'server',
			collectors: ['transfercollect', 'redirectcollect']
		} as SA.Audit.Meta;
	}

	/**
	 * @param traces requiredTraces
	 */
	static audit(traces: SA.DataLog.Traces): SA.Audit.Result | undefined {
		debug('running')
		const {url} = traces;
		const urls = new Set();
		const hosts = new Set();
		const initialHost = new URL(url).hostname;
		hosts.add(initialHost);

		// Check if there has been a redirect to initial host

		const redirect = traces.redirect?.find(
			record => new URL(record.url).hostname === initialHost
		)?.redirectsTo;

		if (redirect) {
			hosts.add(new URL(redirect).hostname);
		}

		const resources = traces.record
			.filter(record => {
				const hostname = new URL(record.request.url).hostname;
				if (record.response.fromServiceWorker) return false;
				if (record.request.protocol === 'h2') return false;
				if (!Array.from(hosts.values()).includes(hostname)) return false;

				return true;
			})
			.map((record: any) => {
				return {
					protocol: record.request.protocol,
					url: record.request.url
				};
			})
			.filter((record: any) => {
				if (urls.has(record.url)) return false;
				urls.add(record.url);
				return true;
			});

		const score = Number(urls.size === 0);
		const meta = Audit.successOrFailureMeta(UsesHTTP2Audit.meta, score);
		debug('done')
		return {
			meta,
			score,
			scoreDisplayMode: 'binary'
		};
	}
}
