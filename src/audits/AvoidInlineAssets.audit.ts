import { Meta, Result } from "../types/audit";
import { Traces } from "../types/traces";
import Audit from "./audit";
import * as util from '../utils/utils'

const MAX_SINGLE_INLINE_ASSET_SIZE = 2048
export default class AvoidInlineAssetsAudit extends Audit{
    static get meta(){
        return {
			id: 'avoidinlineassets',
			title: `Avoid HTML inlining of big size css/js assets`,
			failureTitle: `Uses HTML inlining on big size css/js assets `,
			description: `It's not recommended to inline big (>2kb) static resources since they can't be cached on browser memory`,
			category: 'design',
			collectors: ['transfercollect']
		} as Meta;
	}
	
	static audit(traces:Traces):Result{
		const debug = util.debugGenerator('AvoidInlineAssets Audit');
		debug('running');
		const bigInlineAssets = [...traces.css.info.styles, ...traces.js.info.scripts].map(asset=>{
			return {
				name:asset.src,
				size:asset.size
			}
		})
		.filter(asset=>{
			if(asset.size < MAX_SINGLE_INLINE_ASSET_SIZE) return false

			return true
		})

		const score = Number(bigInlineAssets.length === 0);

		const meta = util.successOrFailureMeta(
			AvoidInlineAssetsAudit.meta,
			score
		);
		debug('done');

		return {
			meta,
			score,
			scoreDisplayMode: 'binary',
			...(bigInlineAssets.length > 0
				? {
						extendedInfo: {
							value: bigInlineAssets
						}
				  }
				: {})
		};

	}
}