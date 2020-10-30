import {Meta, Result, SkipResult} from '../types/audit';
import {Traces} from '../types/traces';
import Audit from './audit';
import * as util from '../utils/utils';

export default class UsesWebmVideoFormatAudit extends Audit {
	static get meta() {
		return {
			id: 'webmvideos',
			title: 'Use WebM video format',
			failureTitle: `Don’t use WebM video format`,
			description:
				'WebM videos provides superior lossless and lossy compression for videos on the web. They maintain a low file size and high quality at the same time.  Although browser support is good (95%) you may use WebM videos along with other fallback sources.',
			category: 'design',
			collectors: ['lazymediacollect', 'mediacollect']
		} as Meta;
	}

	static audit(traces: Traces): Result | SkipResult {
		const debug = util.debugGenerator('UsesWebMVideoFormat Audit');
		const isAuditApplicable = (): boolean => {
			if (!traces.media.videos.length) return false;
			return true;
		};

		if (isAuditApplicable()) {
			debug('running');
			const auditUrls = new Set<string>();
			// @ts-ignore flatMap
			let mediaVideos: string[] = traces.media.videos.flatMap(vid =>
				vid.src ? [vid.src] : []
			);

			if (traces.lazyMedia.lazyVideos) {
				mediaVideos = [...mediaVideos, ...traces.lazyMedia.lazyVideos];
			}

			mediaVideos.filter(url => {
				if (auditUrls.has(url)) return false;
				if (url.endsWith('.webm')) return false;
				const urlLastSegment =
					url
						.split('/')
						.filter(Boolean)
						.pop() ?? url;
				auditUrls.add(urlLastSegment.split('?')[0]);
				return true;
			});

			const score = Number(auditUrls.size === 0);
			const meta = util.successOrFailureMeta(
				UsesWebmVideoFormatAudit.meta,
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
			meta: util.skipMeta(UsesWebmVideoFormatAudit.meta),
			scoreDisplayMode: 'skip'
		};
	}
}
