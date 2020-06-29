import Audit from './audit';
import * as util from '../utils/utils';

const debug = util.debugGenerator('UsesWebPImageFormat Audit');

export default class UsesWebpImageFormatAudit extends Audit {
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

	static audit(traces: SA.Traces.Traces): SA.Audit.Result {
		const isAuditApplicable = (): boolean => {
			if (!traces.media.images.length) return false;
			return true;
		};

		if (isAuditApplicable()) {
			debug('running');
			const auditUrls = new Set<string>();
			// @ts-ignore flatMap
			const mediaImages: string[] = traces.media.images.flatMap(img =>
				img.src ? [img.src] : []
			);
			mediaImages.concat(traces.lazyImages).filter(url => {
				if (auditUrls.has(url)) return false;
				if (url?.startsWith('data:')) {
					auditUrls.add(url.slice(0, 10));
					return false;
				}

				auditUrls.add(
					url
						.split('/')
						.filter(Boolean)
						.pop() ?? url
				);
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
