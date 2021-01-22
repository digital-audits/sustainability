import Audit from './audit';
import * as util from '../utils/utils';
import { Meta, SkipResult, Result } from '../types/audit';
import { Traces } from '../types/traces';

export default class UsesWebpImageFormatAudit extends Audit {
	static get meta() {
		return {
			id: 'webpimages',
			title: 'Use WebP image format',
			failureTitle: `Don’t use WebP image format`,
			description:
				'WebP images provides superior lossless and lossy compression for images on the web. They maintain a low file size and high quality at the same time.  Although browser support is good (77%) you may use WebP images along with other fallback sources.',
			category: 'design',
			collectors: ['lazymediacollect', 'mediacollect', 'lazymediacollect']
		} as Meta;
	}

	/**
	 *
	 * @applicable if the page has requested images.
	 * Get image format using the MIME/type (header: content-type), 
	 * (careful with this: because sometimes as in AWS S3 the content-type defaults to binary/octet-stream)
	 * WebP should be used against PNG, JPG or GIF images and ofc base64 data images
	 */

	static audit(traces: Traces): Result | SkipResult {
		const debug = util.debugGenerator('UsesWebPImageFormat Audit');

		const mediaImages = [...traces.lazyMedia.lazyImages,
		...traces.record.filter(r => r.request.resourceType === 'image').map(r => r.response.url.toString())];

		const isAuditApplicable = (): boolean => {
			if (!mediaImages.length) return false;
			if (!mediaImages.some(url => /\.(?:jpg|gif|png|svg)$/.test(url)))
				return false;

			return true;
		};

		if (isAuditApplicable()) {
			debug('running');
			const auditUrls = new Set<string>();

			mediaImages.filter(url => {
				if (url.startsWith('data:')) {
					auditUrls.add(url.slice(0, 40));
					return false;
				}
				if (url.endsWith('.webp')) return false;
				if (!/\.(?:jpg|gif|png)$/.test(url)) return false;
				const urlLastSegment = util.getUrlLastSegment(url);
				auditUrls.add(urlLastSegment.split('?')[0]);
				return true;
			});

			const score = Number(auditUrls.size === 0);
			const meta = util.successOrFailureMeta(
				UsesWebpImageFormatAudit.meta,
				score
			);
			debug('done');
			return {
				meta,
				score,
				scoreDisplayMode: 'binary',
				...(auditUrls.size > 0
					? {
						extendedInfo: {
							value: Array.from(auditUrls.values())
						}
					}
					: {})
			};
		}

		debug('skipping non applicable audit');

		return {
			meta: util.skipMeta(UsesWebpImageFormatAudit.meta),
			scoreDisplayMode: 'skip'
		};
	}
}
