import Collect from './collect';
import {PrivateSettings} from '../types/settings';
import * as util from '../utils/utils';
import {CollectMeta} from '../types/audit';
import {PageContext} from '../types';
import {CollectAnimationsTraces, SingleAnimationFormat} from '../types/traces';
// Const TraceToTimelineModel = require('devtools-timeline-model');

/**
 * @overview: Get CSSTransitions/CSSAnimations, stuff that requires CPU process and see if they are stoped when tab is switched
 */

// fails on : https://codebeautify.org/jsonminifier
export default class CollectAnimations extends Collect {
	static get meta() {
		return {
			id: 'animationscollect',
			passContext: 'networkidle0',
			debug: util.debugGenerator('Animations Collect')
		} as CollectMeta;
	}

	static async collect(
		pageContext: PageContext,
		settings: PrivateSettings
	): Promise<CollectAnimationsTraces | undefined> {
		try {
			// https://chromedevtools.github.io/devtools-protocol/tot/DOM/#type-Node
			const debug = CollectAnimations.meta.debug;
			debug('running');
			const {page} = pageContext;

			const client = await page.target().createCDPSession();
			await client.send('Animation.enable');
			await client.send('DOM.enable');
			const animations: Map<string, any> = new Map();
			const getClassOrIdName = (nodeAttributes: any, type: string) => {
				const classNameIndex = nodeAttributes.findIndex(
					(attr: any) => attr === type
				);
				const className =
					classNameIndex > -1
						? nodeAttributes[classNameIndex + 1].split(' ')[0]
						: undefined;
				return className;
			};

			const reactiveAnimationsSet = new Set<string>();
			client.on('Animation.animationCanceled', data => {
				reactiveAnimationsSet.add(data.id);
			});

			client.on('Animation.animationStarted', async data => {
				const backendNodeId = data.animation.source.backendNodeId;
				const nodeInfo: any = await client.send('DOM.describeNode', {
					backendNodeId
				});
				const nodeAttributes = nodeInfo.node.attributes;
				const classname = getClassOrIdName(nodeAttributes, 'class');
				const idname = getClassOrIdName(nodeAttributes, 'id');
				if (classname || idname) {
					data.animation.meta = {classname, idname};
					animations.set(data.animation.id, data.animation);
				}
			});
			const notReactiveAnimations: SingleAnimationFormat[] = [];
			const notReactiveAnimationsSet = new Set<string>();
			const hasAnimations = await new Promise((resolve, reject) => {
				// @ts-ignore scrollFinished (custom event emited in lazyMedia collect)
				page.once('scrollFinished', async function scrollHandler() {
					try {
						const animationsArray = Array.from(animations.entries());
						if (!animationsArray.length) {
							throw new Error('No animations found');
						}

						const reactiveAnimationArray = Array.from(
							reactiveAnimationsSet.values()
						);
						animationsArray.filter(animation => {
							const data = animation[1];
							const id = animation[0];
							if (reactiveAnimationArray.includes(id)) return true;
							const {classname, idname} = data.meta;
							if (!notReactiveAnimationsSet.has(data.name)) {
								notReactiveAnimations.push({
									name: data.name,
									type: data.type,
									selector: classname ? classname : idname
								});
								notReactiveAnimationsSet.add(data.name);
							}

							return false;
						});
						resolve(true);
					} catch (error) {
						util.log(`Error: Animations collect failed with message: ${error}`);
						reject(false);
					} finally {
						page.removeListener('scrollFinished', scrollHandler);
					}
				});
			});
			debug('done');
			return {
				animations: hasAnimations
					? {notReactive: notReactiveAnimations}
					: undefined
			};

			/*

			*/

			// get initial trace
			/* const categories: string[] = [
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
			];

			const processTracingAndGetSummary = async () => {
				await page.tracing.start({
					path: '',
					categories,
					screenshots: false
				});
				await new Promise(resolve => setTimeout(() => resolve(), 1000)); // Wait 1sec
				const rawData = await page.tracing.stop();
				const data = JSON.parse(rawData.toString());
				const model = new TraceToTimelineModel(data.traceEvents);
				const timelineModel = model.timelineModel();
				const start = timelineModel._minimumRecordTime;
				const end = timelineModel._maximumRecordTime;
				// @ts-ignore
				return util.getSummary(timelineModel, start, end);
			};

			/**
			 * Find ROIs
			 * initial summary
			 * move viewport (scroll by y) outside ROI
			 * second summary
			 * compare diff
			 */
			/*
			const getSummary = async () => {
				const summaryArray: AnimationsFormat[] = [];
				debug('getting init page tracing');
				const initSummary = await processTracingAndGetSummary();
				await new Promise(resolve => {
					// @ts-ignore custom event
					page.on('scrollFinished', async () => {
						debug('getting after-scroll page tracing');
						const endSummary = await processTracingAndGetSummary();

						summaryArray.push({initSummary, endSummary});
						resolve();
					});
				});

				return summaryArray;
			};

			const summary = await getSummary();

			page.removeListener('scrollFinished', () => {
				debug('removed scrollFinished event listener');
			});

			debug('done');
			*/
		} catch (error) {
			util.log(`Error: Animations collect failed with message: ${error}`);
			return {animations: undefined};
		}
	}
}
