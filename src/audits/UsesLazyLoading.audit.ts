import Audit from './audit';
import * as util from '../utils/utils';
import { Meta, Result, SkipResult } from '../types/audit';
import { Traces } from '../types/traces';

/**
 * Test with https://mathiasbynens.be/demo/img-loading-lazy
 */

export default class UsesLazyLoadingAudit extends Audit {
	static get meta() {
		return {
			id: 'lazyloading',
			title: 'Uses lazy loading on media assets',
			failureTitle: `Ensure media assets are lazy loaded`,
			description:
				'Lazy loading is a powerful feature. It instructs the browser not to download an asset until an specific event happens. Now it is natively supported on HTML on img and iframe elements. <a rel="noopener noreferrer" target="_blank" href="https://developer.mozilla.org/en-US/docs/Web/Performance/Lazy_loading">More info</a>.',
			category: 'design',
			collectors: ['mediacollect', 'lazymediacollect']
		} as Meta;
	}

	static audit(traces: Traces): Result | SkipResult {
		const debug = util.debugGenerator('UsesLazyLoading Audit');

		const isAuditApplicable = (): boolean => {
			if (!traces.lazyMedia) return false;
			const nonLazyMedia = [...traces.media.images, ...traces.media.videos];
			if (!nonLazyMedia.length) return false
			if (!nonLazyMedia.some(media => !media.isVisible)) return false;

			return true;
		};

		if (isAuditApplicable()) {
			debug('running');
			const lazyMedia = [
				...traces.lazyMedia.lazyImages,
				...traces.lazyMedia.lazyVideos
			];
			const score = Number(lazyMedia.length > 0);
			const meta = util.successOrFailureMeta(UsesLazyLoadingAudit.meta, score);
			debug('done');

			return {
				meta,
				score,
				scoreDisplayMode: 'binary'
			};
		}

		debug('skipping non applicable audit');

		return {
			meta: util.skipMeta(UsesLazyLoadingAudit.meta),
			scoreDisplayMode: 'skip'
		};
	}
}
