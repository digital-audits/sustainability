import Audit from './audit';
import {Meta, Result, SkipResult} from '../types/audit';
import {Traces, Scripts, CodeMap, MapReadSources} from '../types/traces';
import * as util from '../utils/utils';
import {RawSourceMap} from 'source-map';

export const LOW_MAINTAINABILITY_THRESHOLD = 70;

export class MaintainabilityAudit extends Audit {
	static get meta() {
		return {
			id: 'maintainability',
			title: `project is maintainable`,
			failureTitle: 'Mainatainability issues on source code',
			description: `A maintainable code considerable reduces the energy and the related costs.`,
			category: 'design',
			collectors: ['assetscollect']
		} as Meta;
	}

	static async audit(traces: Traces): Promise<Result | SkipResult> {
		const FIND_NODE_MODULES_PATH = /node_modules/i;
		const FIND_VENDOR_PATH = /vendor/i;
		const debug = util.debugGenerator('Maintainability Audit');
		let errorMessage:string|undefined;
		// @ts-ignore @flatMap
		const jsScripts= traces.js.scripts
		const isAuditApplicable = (): boolean => {
			if (!(jsScripts.length > 0)) return false;
			return true;
		};

		if (isAuditApplicable()) {
			debug('running');

			try {
				// Fetch relative maps
				const responsesPArray = jsScripts.map(async script => {
					if (script.map.type === 'relative') {
						return util.fetchRequest(script.map.value as string);
					}

					return script.map.value;
				});

				const responses: RawSourceMap[] = await Promise.all(responsesPArray);
				const nonUndefinedResponses = responses.filter(r => r);
				if (nonUndefinedResponses.length > 0) {
					const sourcesPArray = nonUndefinedResponses.map(async r =>
						util.readSources(r, debug)
					);
					const sources = await Promise.all(sourcesPArray);
					console.log(sources)

					// @ts-ignore @flatMap
					
					
					const results = sources.flatMap((source: MapReadSources) => {
						const nonNodeModulesCodes = source.code.filter(
							s => {
								if(FIND_NODE_MODULES_PATH.test(s.path)) return false
								if(FIND_VENDOR_PATH.test(s.path)) return false

								return true
							}
						);
						const lowMaintainabilityModuleReport = util.getLowMaintainabilityModuleReports(
							nonNodeModulesCodes, 
						);

						return lowMaintainabilityModuleReport.length > 0
							? lowMaintainabilityModuleReport
							: [];
					});

					const score = Number(results.length === 0);
					const meta = util.successOrFailureMeta(
						MaintainabilityAudit.meta,
						score
					);

					debug('done');

					return {
						meta,
						score,
						scoreDisplayMode: 'binary',
						extendedInfo: {
							value: results
						}
					};
				}

				throw new Error('Failed to fetch source map files');
			} catch (error) {
				debug(error);
				errorMessage = error.message
			}
		}

		debug('skipping non applicable audit');
		
		return {
			meta: util.skipMeta(MaintainabilityAudit.meta),
			scoreDisplayMode: 'skip',
			...(errorMessage ? {errorMessage} : {})
		};
	}
}
