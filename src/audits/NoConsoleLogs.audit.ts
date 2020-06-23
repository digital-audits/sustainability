import {Audit} from './audit';
import { debugGenerator } from '../utils/utils';

const debug = debugGenerator('NoConsoleLogs Audit')
export class NoConsoleLogsAudit extends Audit {
	static get meta() {
		return {
			id: 'noconsolelogs',
			title: `Don’t have console logs`,
			failureTitle: 'Have console logs',
			description: `It is important to keep the console log clean of error, warning or info outputs.`,
			category: 'design',
			collectors: ['consolecollect']
		} as SA.Audit.Meta;
	}

	static audit(traces: SA.DataLog.Traces): SA.Audit.Result {
		debug('running')
		const dups = new Set();
		const uniqueResources = traces.console.filter(trace => {
			const dup = dups.has(trace.text);
			dups.add(trace.text);
			return !dup;
		});
		const score = Number(uniqueResources.length === 0);
		const meta = Audit.successOrFailureMeta(NoConsoleLogsAudit.meta, score);
		debug('done')
		return {
			meta,
			score,
			scoreDisplayMode: 'binary',
			extendedInfo: {
				value: uniqueResources
			}
		};
	}
}
