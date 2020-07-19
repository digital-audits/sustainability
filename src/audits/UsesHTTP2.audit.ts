import Audit from './audit';
import * as util from '../utils/utils';
import {Meta, SkipResult, Result} from '../types/audit';
import {Traces} from '../types/traces';

/**
 * @fileoverview Audit request in the same origin as host use HTTP2.0
 */

const debug = util.debugGenerator('UsesHTTP2 Audit');
export default class UsesHTTP2Audit extends Audit {
	static get meta() {
		return {
			id: 'useshttp2',
			title: 'Use HTTP2',
			failureTitle: `Don’t use HTTP2`,
			description: `HTTP2 provides advantages such as:
            multiplexing, server push, binary headers and increased security.`,
			category: 'server',
			collectors: ['transfercollect', 'redirectcollect']
		} as Meta;
	}

	/**
	 * @param traces requiredTraces
	 */
	static audit(traces: Traces): Result | SkipResult | undefined {
		debug('running');
		const {hosts} = traces;
		const auditUrls = new Set();
		traces.record
			.filter(record => {
				const recordUrl = record.request.url;
				if (record.response.fromServiceWorker) return false;
				if (record.request.protocol === 'h2') return false;
				if (record.request.protocol === 'data') return false;
				if (!hosts.includes(recordUrl.hostname)) return false;

				return true;
			})
			.map((record: any) => {
				return {
					protocol: record.request.protocol,
					url: record.request.url
				};
			})
			.filter((record: any) => {
				if (auditUrls.has(record.url)) return false;
				auditUrls.add(record.url);
				return true;
			});

		const score = Number(auditUrls.size === 0);
		const meta = util.successOrFailureMeta(UsesHTTP2Audit.meta, score);
		debug('done');
		return {
			meta,
			score,
			scoreDisplayMode: 'binary'
		};
	}
}
