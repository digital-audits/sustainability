import { Meta, Result } from '../types/audit';
import { Traces } from '../types/traces';
import Audit from './audit';
import * as util from '../utils/utils';

export default class AvoidURLRedirectsAudit extends Audit {
	static get meta() {
		return {
			id: 'avoidurlredirects',
			title: `Avoids URL redirects`,
			failureTitle: `Has URL redirects`,
			description: `URL redirects create unnecessary HTTP traffic`,
			category: 'server',
			collectors: ['redirectcollect']
		} as Meta;
	}

	static audit(traces: Traces): Result {
		const debug = util.debugGenerator('AvoidURLRedirects Audit');
		const { hosts } = traces;
		debug('running');
		const redirects = traces.redirect
			.filter(record => {
				return hosts.includes(new URL(record.url).hostname)
			})
			.map(r => {
				return {
					url: r.url,
					redirectsTo: r.redirectsTo
				};
			});

		const score = Number(redirects.length === 0);
		const meta = util.successOrFailureMeta(AvoidURLRedirectsAudit.meta, score);
		debug('done');
		return {
			meta,
			score,
			scoreDisplayMode: 'binary',
			...(redirects.length
				? {
					extendedInfo: {
						value: redirects
					}
				}
				: {})
		};
	}
}
