import Collect from './collect';
import {ConnectionSettingsPrivate} from '../types/settings';
import * as util from '../utils/utils';
import {CollectorsIds} from '../types/audit';
import {PageContext} from '../types';
import { AnimationsFormat, CollectAnimationsTraces } from '../types/traces';
const TraceToTimelineModel = require('devtools-timeline-model')

/**
 * @overview: Get CSSTransitions/CSSAnimations, stuff that requires CPU process and see if they are stoped when tab is switched
 */ 

 //fails on : https://codebeautify.org/jsonminifier
export default class CollectAnimations extends Collect {
	collectId: CollectorsIds = 'transfercollect';
	static get id() {
		return this.collectId;
	}

	static async collect(
		pageContext: PageContext,
		settings: ConnectionSettingsPrivate
	): Promise<CollectAnimationsTraces | undefined> {
	try {

//https://chromedevtools.github.io/devtools-protocol/tot/DOM/#type-Node
const debug = util.debugGenerator('Animations collect')
debug('running')
const {page} = pageContext
/*
const client = await page.target().createCDPSession();
await client.send('Animation.enable');
await client.send('DOM.enable')
const animations: Array<any>= []
client.on('Animation.animationStarted',async (data) =>{
	const animationId = data.animation.id
	const animationName = data.animation.name
	const animationType = data.animation.type
	const isAnimationPaused = data.animation.pausedState
	const animationPlayState = data.animation.playState
	const backendNodeId = data.animation.source.backendNodeId
	const nodeInfo:any= await client.send('DOM.describeNode', {backendNodeId})
	const nodeAttributes = nodeInfo.node.attributes
	const output = {animationId, animationName, animationType, isAnimationPaused, animationPlayState, nodeAttributes}
 animations.push(output)
})
*/

//get initial trace
const categories: string[] = [
	'-*',
	'v8.execute',
	'blink.user_timing',
	'latencyInfo',
	'devtools.timeline',
	'disabled-by-default-devtools.timeline',
	'disabled-by-default-devtools.timeline.frame',
	'toplevel',
	'blink.console',
	'disabled-by-default-devtools.timeline.stack',
	'disabled-by-default-devtools.screenshot',
	'disabled-by-default-v8.cpu_profile',
	'disabled-by-default-v8.cpu_profiler',
	'disabled-by-default-v8.cpu_profiler.hires'
  ]
  
const processTracingAndGetSummary = async()=>{
	await page.tracing.start({path:'', categories:categories, screenshots:false})
	await new Promise((resolve)=>setTimeout(()=>resolve(),1000)) //wait 1sec
	const rawData = await page.tracing.stop()
	const data = JSON.parse(rawData.toString())
	const model = new TraceToTimelineModel(data.traceEvents);
	const timelineModel = model.timelineModel();
	const start = timelineModel._minimumRecordTime;
	const end = timelineModel._maximumRecordTime;
	
	return util.getSummary(timelineModel, start, end)
	
}

/**
 * find ROIs
 * initial summary 
 * move viewport (scroll by y) outside ROI
 * second summary
 * compare diff
 */
const getSummary = async () =>{
	const summaryArray:AnimationsFormat[]= []
	debug('getting init page tracing')
	const initSummary= await processTracingAndGetSummary()
	await new Promise((resolve)=>{
		//@ts-ignore custom event
	page.on('scrollFinished', async ()=>{
		debug('getting after-scroll page tracing')
		const endSummary= await processTracingAndGetSummary()
		
		summaryArray.push({initSummary, endSummary})
		resolve()
})
	})

	return summaryArray		
}

const summary = await getSummary()



page.removeListener('scrollFinished', ()=>{
	debug('removed scrollFinished event listener')
})



debug('done')
console.log(summary)
return {animations:summary}
}catch(error){
	util.log(`Error: Animations collect failed with message: ${error}`)
	return undefined
	}
	}
}
		