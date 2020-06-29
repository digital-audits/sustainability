import Audit from './audit';
import * as util from '../utils/utils';
import * as fs from 'fs'

const debug = util.debugGenerator('NoConsoleLogs Audit')
export default class NoConsoleLogsAudit extends Audit {
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

	static audit(traces: SA.Traces.Traces): SA.Audit.Result {
		debug('running')
		fs.writeFile('traces.txt', JSON.stringify(traces), (err)=>{
			if(err){
				console.log(err)
			}
		})
		const dups = new Set();
		const uniqueResources = traces.console.filter(trace => {
			const dup = dups.has(trace.text);
			dups.add(trace.text);
			return !dup;
		});
		const score = Number(uniqueResources.length === 0);
		const meta = util.successOrFailureMeta(NoConsoleLogsAudit.meta, score);
		debug('done')
		return {
			meta,
			score,
			scoreDisplayMode: 'binary',
			...(uniqueResources.length ? {
				extendedInfo : {
				value:uniqueResources
			}
		}: {}),
		};
	}
}
