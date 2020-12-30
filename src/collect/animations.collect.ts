import Collect from './collect';
import { PrivateSettings } from '../types/settings';
import * as util from '../utils/utils';
import { CollectMeta } from '../types/audit';
import { PageContext } from '../types';
import { CollectAnimationsTraces, SingleAnimationFormat } from '../types/traces';

/**
 * @overview: Get CSSTransitions/CSSAnimations, stuff that requires CPU process and see if they are stoped when tab is switched
 */

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
			const debug = CollectAnimations.meta.debug;
			debug('running');
			const { page } = pageContext;

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
					data.animation.meta = { classname, idname };
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
							const { classname, idname } = data.meta;
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
					? { notReactive: notReactiveAnimations }
					: undefined
			};
		} catch (error) {
			util.log(`Error: Animations collect failed with message: ${error}`);
			return { animations: undefined };
		}
	}
}
