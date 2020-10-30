import {Meta, Result, SkipResult} from '../types/audit';
import {Traces} from '../types/traces';
import Audit from './audit';
import * as utils from '../utils/utils';

export default class ReactiveAnimationsAudit extends Audit {
	static get meta() {
		return {
			id: 'reactiveanimations',
			title: `Animations are reactive`,
			failureTitle: `Animations are not reactive`,
			description: `CSS animations should only run whenever the user is interacting with them and automatically pause otherwise. <a href="https://gist.github.com/sirdmon/0fda06c8288ad0fc9712d9f2f955c907">More info</a>`,
			category: 'design',
			collectors: ['animationscollect', 'lazymediacollect']
		} as Meta;
	}

	static audit(traces: Traces): Result | SkipResult {
		const debug = utils.debugGenerator('SmartAnimations Audit');
		debug('running');

		const isAuditApplicable = (): boolean => {
			if (!traces.animations) return false;
			return true;
		};

		if (isAuditApplicable()) {
			const score = Number(traces.animations.notReactive.length === 0);
			const meta = utils.successOrFailureMeta(
				ReactiveAnimationsAudit.meta,
				score
			);
			debug('done');

			return {
				meta,
				score,
				scoreDisplayMode: 'binary',
				...(score
					? {}
					: {
							extendedInfo: {
								value: traces.animations.notReactive
							}
					  })
			};
		}

		debug('skipping non applicable audit');

		return {
			meta: utils.skipMeta(ReactiveAnimationsAudit.meta),
			scoreDisplayMode: 'skip'
		};
	}
}
