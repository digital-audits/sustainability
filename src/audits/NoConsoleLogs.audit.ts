import Audit from './audit';
import * as util from '../utils/utils';
import { Meta, Result } from '../types/audit';
import { Traces } from '../types/traces';

export default class NoConsoleLogsAudit extends Audit {
	static get meta() {
		return {
			id: 'noconsolelogs',
			title: `Does not have console logs`,
			failureTitle: 'Avoid console logs',
			description: `It is important to keep the console log clean of error, warning or info outputs.`,
			category: 'design',
			collectors: ['consolecollect']
		} as Meta;
	}

	static audit(traces: Traces): Result {
		const debug = util.debugGenerator('NoConsoleLogs Audit');
		debug('running');
		const dups = new Set();
		const uniqueResources = traces.console?.filter(trace => {
			const dup = dups.has(trace.text);
			dups.add(trace.text);
			return !dup;
		});
		const score = Number(uniqueResources?.length === 0);
		const meta = util.successOrFailureMeta(NoConsoleLogsAudit.meta, score);
		debug('done');
		return {
			meta,
			score,
			scoreDisplayMode: 'binary',
			...(uniqueResources?.length
				? {
					extendedInfo: {
						value: uniqueResources
					}
				}
				: {})
		};
	}
}
