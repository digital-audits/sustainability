import {Audit} from './audit';
import { debugGenerator } from '../utils/utils';

const debug = debugGenerator('UsesWebPImageFormat Audit')
const APPLICABLE_IMAGE_MIME_TYPES = ['image/png', 'image/jpeg', 'image/gif'];
const imageEndRegexp = /\.(?:jpg|gif|png)/

export class UsesWebpImageFormatAudit extends Audit {
	static get meta() {
		return {
			id: 'webpimages',
			title: 'Use WebP image format',
			failureTitle: `Don’t use WebP image format`,
			description:
				'WebP images provides superior lossless and lossy compression for images on the web. They maintain a low file size and high quality at the same time.  Although browser support is good (77%) you may use WebP images along with other fallback sources.',
			category: 'design',
			collectors: ['transfercollect', 'imagescollect']
		} as SA.Audit.Meta;
	}

	/**
	 *
	 * @param traces SA.DataLog.TransferTraces
	 * Get image format using the MIME/type (header: content-type)
	 * WebP should be used against PNG, JPG or GIF images
	 */

	
	static audit(traces: SA.DataLog.Traces): SA.Audit.Result {

		const isAuditApplicable = ():boolean =>{
			if(!traces.media.images.length) return false
			return true
		}

		if(isAuditApplicable()){
			debug('running')
			const urls = new Set();
			const resources = traces.record
				.reduce(
					(acc: string[], value) =>
						value.request.resourceType === 'image' &&
						APPLICABLE_IMAGE_MIME_TYPES.includes(
							value.response.headers['content-type']
						)
						&& imageEndRegexp.test(value.request.url)
							? acc.concat(value.request.url)
							: acc,
					[]
				)
				.filter((url: any) => {
					if (urls.has(url)) return false;
					if (url.startsWith('data:')) {
						urls.add(url.slice(0, 10));
						return false;
					}
	
					urls.add(new URL(url).pathname.split('/').filter(Boolean).pop())
					return true;
				});
	
			const score = Number(urls.size === 0);
			const meta = Audit.successOrFailureMeta(
				UsesWebpImageFormatAudit.meta,
				score
			);
			debug('done')
			return {
				meta,
				score,
				scoreDisplayMode: 'binary',
				extendedInfo: {
					value: Array.from(urls.values())
				}
			};
		}

		debug('skipping non applicable audit')
		
		return {
			meta:UsesWebpImageFormatAudit.meta,
			scoreDisplayMode: 'skip'
		}
	}
}
