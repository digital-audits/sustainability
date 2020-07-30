import Audit from "./audit";
import { Meta, Result, SkipResult } from "../types/audit";
import { Traces,  Scripts } from "../types/traces";
import * as util from '../utils/utils'
import { request } from "http";
import { SSL_OP_SSLEAY_080_CLIENT_DH_BUG } from "constants";
import { strict } from "assert";

export class MaintainabilityAudit extends Audit{
    static get meta() {
		return {
			id: 'maintainability',
			title: `javascript code is maintainable`,
			failureTitle: 'Mainatainability problems on javascript files',
			description: `A maintainable code considerable reduces the energy and the cost required to build the code.`,
			category: 'design',
			collectors: ['assetscollect']
		} as Meta;
	}

	static async audit(traces: Traces): Promise<Result | SkipResult> {

        const FIND_SOURCE_FILE = /\/\/#\s*sourceMappingURL=([.\w]+map)/iu;
        const FIND_SOURCE_BASE64 = /\/\*?\/?#\s*sourceMappingURL=([.\w\-/=;:]*)base64,([\w]+=)/iu;
        const FIND_SOURCE_UENC = /\/\*?\/?#\s*sourceMappingURL=([.\w\-/=;:]+),([;:,.\-\w%]+)/iu;

        const debug = util.debugGenerator('Maintainability Audit');
        const findMap = (script:Scripts):string|boolean =>{
        
            const input = script.text
            if(input.match(FIND_SOURCE_BASE64)){
                const sourceMappingMatch = FIND_SOURCE_BASE64.exec(input);
                if (sourceMappingMatch && sourceMappingMatch.length > 2) {
                    const buf = Buffer.from(sourceMappingMatch[2], 'base64');
                    debug(`Input ${script.url} contains Base64 of ${sourceMappingMatch[2].length} length`)
                    return buf.toString('utf8');
                }
            }
            else if (input.match(FIND_SOURCE_UENC)) {
                const sourceMappingMatch = FIND_SOURCE_UENC.exec(input);
                if (sourceMappingMatch && sourceMappingMatch.length > 2) {
                    const buf = Buffer.from(sourceMappingMatch[2], 'ascii');
                    debug(`Input ${script.url} contains URL encoded of ${sourceMappingMatch[2].length} length`)
                    return buf.toString('utf8');
                }
        }
            else if (input.match(FIND_SOURCE_FILE)) {
                const sourceMappingMatch = FIND_SOURCE_FILE.exec(input);
                if (sourceMappingMatch && sourceMappingMatch.length > 1) {
                    debug(`Input ${script.url} points to "${sourceMappingMatch[1]}"`)
                    const urlLastSegment =
					script.url
						.split('/')
						.filter(Boolean)
                        .pop() ?? undefined;
                    return urlLastSegment?`${script.url.substring(script.url.search(new RegExp(urlLastSegment)),-1)}${sourceMappingMatch[1]}`:false
                }
            }

            debug(`Input ${script.url} was not a map nor a code file`)

            return false
        }
        const {hosts} = traces;
        //@ts-ignore
        const jsScripts: Array<string>= traces.js.scripts.flatMap(script=>{
            const scriptUrl = new URL(script.url)
            const urlName = new RegExp(hosts[0].replace(/^www\./,'').split('.').slice(0,-1).join('.'))
            
            const ipAddress = traces.record.find(res=>res.response.url.toString() === scriptUrl.toString())?.response.remoteAddress.ip
            const ipOrigin = traces.record.find(res=>res.request.url.hostname === hosts[0])?.response.remoteAddress.ip
            
       
            if(hosts.includes(new URL(script.url).hostname) || (ipAddress === ipOrigin) || urlName.test(script.url)){
                const mapFile = findMap(script)
                if(mapFile){
                    return [mapFile]                    
                }
            }
            return []
         
        })

        const isAuditApplicable = ():boolean => {
            if(!(jsScripts.length >0)) return false                             
            return true
        }

        if(isAuditApplicable()){
            debug('running')

            try{
            const score:number= 1;
            const meta = util.successOrFailureMeta(
				MaintainabilityAudit.meta,
				score
            );
            const responsesPArray = jsScripts.map(async script=>await util.fetchRequest(script))
            
            const responses = await Promise.all(responsesPArray)
            //@ts-ignore
            const sourcesPArray = responses.map(async (r,i)=>await util.readSources(r, jsScripts[i], debug))
            const sources:any = await Promise.all(sourcesPArray)
            const results = sources.map((script:Array<string>)=>{
               const reports = []
               reports.push(script.map(s=>util.obtainCodeIndexes(s)))
                return {
                    reports
                }
            })

            console.log(JSON.stringify(results))
            
            return {
                meta,
                score,
                scoreDisplayMode: 'binary'
            }
        }catch(e){
            debug(e)
        }
        }

        debug('skipping non applicable audit')

        return {
			meta: util.skipMeta(MaintainabilityAudit.meta),
			scoreDisplayMode: 'skip'
        };
        

    }

}