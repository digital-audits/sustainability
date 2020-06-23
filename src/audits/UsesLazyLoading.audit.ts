import {Audit} from './audit';
import { debugGenerator } from '../utils/utils';

/**
 * Test with https://mathiasbynens.be/demo/img-loading-lazy
 */
const debug = debugGenerator('UsesLazyLoading Audit')
export class UsesLazyLoadingAudit extends Audit {
	static get meta() {
		return {
			id: 'lazyloading',
			title: 'Use lazy loading on media assets',
			failureTitle: `Don’t use lazy loading on media assets`,
			description:
				'Lazy loading is a powerful feature. It instructs the browser not to download an asset until an specific event happens. Now it is natively supported on HTML on img and iframe elements. <a href="https://developer.mozilla.org/en-US/docs/Web/Performance/Lazy_loading">More info</a>.',
			category: 'design',
			collectors: ['transfercollect', 'imagescollect']
		} as SA.Audit.Meta;
	}

	static audit(traces: SA.DataLog.Traces): SA.Audit.Result {
		
		
		const isAuditApplicable = ():boolean => {
			if(!traces.media.images.length) return false
			if(!traces.media.images.some(image=>!image.isVisible)) return false

			return true
		}
		
		if (isAuditApplicable()){
			debug('running')
			const allImages= traces.record.filter(record=>record.request.resourceType==='image')
			const score = Number(traces.media.images.length !== allImages.length)
			const meta = Audit.successOrFailureMeta(UsesLazyLoadingAudit.meta, score);
			debug('done')
	
			return {
				meta,
				score,
				scoreDisplayMode: 'binary'
			};
		}

		debug('skipping non applicable audit')

		return {
			meta:UsesLazyLoadingAudit.meta,
			scoreDisplayMode:'skip'
		}
		
	}
}
