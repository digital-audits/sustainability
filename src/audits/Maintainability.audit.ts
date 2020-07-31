import Audit from './audit';
import {Meta, Result, SkipResult} from '../types/audit';
import {Traces, Scripts, CodeMap, MapReadSources} from '../types/traces';
import * as util from '../utils/utils';
import {RawSourceMap} from 'source-map';

export const LOW_MAINTAINABILITY_THRESHOLD = 50;

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
        const FIND_NODE_MODULES_PATH = /node_modules/;
        const debug = util.debugGenerator('Maintainability Audit');
        const {hosts} = traces;
        //@ts-ignore @flatMap
        const jsScripts: Array<CodeMap>= traces.js.scripts.flatMap(script=>{

            //TODO: move this to utils 
            const scriptUrl = new URL(script.url)
            const urlName = new RegExp(hosts[0].replace(/^www\./,'').split('.').slice(0,-1).join('.'))
            
            const ipAddress = traces.record.find(res=>res.response.url.toString() === scriptUrl.toString())?.response.remoteAddress.ip
            const ipOrigin = traces.record.find(res=>res.request.url.hostname === hosts[0])?.response.remoteAddress.ip
            
       
            if(hosts.includes(new URL(script.url).hostname) || (ipAddress === ipOrigin) || urlName.test(script.url)){
                const mapFile = util.findMap(script, debug)
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
            
            //fetch relative maps
            const responsesPArray = jsScripts.map(async script=>{

                if(script.type === 'relative'){
                    return await util.fetchRequest(script.value as string)
                } 

                return script.value
                
            })
            
            const responses: Array<RawSourceMap>= await Promise.all(responsesPArray)
          
            const nonUndefinedResponses = responses.filter(r=>r)
            if(nonUndefinedResponses.length > 0){

           
            const sourcesPArray = nonUndefinedResponses.map(async r=>await util.readSources(r, debug))
            const sources = await Promise.all(sourcesPArray)
            //@ts-ignore @flatMap
            const results = sources.flatMap((source:MapReadSources)=>{
               const nonNodeModulesCodes = source.code.filter(s=>!FIND_NODE_MODULES_PATH.exec(s.path))
               const lowMaintainabilityModuleReport = util.getLowMaintainabilityModuleReports(nonNodeModulesCodes, debug)

               return lowMaintainabilityModuleReport.length > 0 ? lowMaintainabilityModuleReport : []

            })

            const score = Number(results.length=== 0)
            const meta = util.successOrFailureMeta(
				MaintainabilityAudit.meta,
				score
            );

            debug('done')
            
            return {
                meta,
                score,
                scoreDisplayMode: 'binary',
                extendedInfo: {
                    value: results
                }
            }
        }
            throw new Error('Failed to fetch source map files')
        
        }catch(e){
            debug(e)
        }
        }
        debug('skipping non applicable audit')

        return {
			meta: util.skipMeta(MaintainabilityAudit.meta),
            scoreDisplayMode: 'skip',
            errorMessage:'Unable to find source map files'
        };
        

    }
}
