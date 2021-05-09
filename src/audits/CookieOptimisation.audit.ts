import { Meta, Result, SkipResult } from '../types/audit';
import { Traces } from '../types/traces';
import Audit from './audit';
import * as util from '../utils/utils';

const MAX_COOKIE_SIZE_IN_BYTES = 1024;

export default class CookieOptimisation extends Audit {
	static get meta() {
		return {
			id: 'cookieoptimisation',
			title: `Cookies are optimised`,
			failureTitle: `Ensure cookies optimisation`,
			description: `Cookies should never exceed more than 1kB in size and always be unique`,
			category: 'server',
			collectors: ['redirectcollect', 'cookiescollect']
		} as Meta;
	}

	static audit(traces: Traces): Result | SkipResult {
		const debug = util.debugGenerator('CookieOptimisation Audit');
		debug('running');

		const isAuditApplicable = (): boolean => {
			if (!traces.cookies?.length) return false;
			return true;
		};

		const { hosts } = traces.server;
		const bigCookies = new Map();
		const findDuplicates = (data: string[]): string[] => {
			return Array.from(new Set(data)).filter(
				value => data.indexOf(value) !== data.lastIndexOf(value)
			);
		};



		if (isAuditApplicable()) {
			traces.cookies.filter(c => {
				if (!hosts.includes(c.domain)) return false;
				if (bigCookies.has(c.name)) return false;
				if (c.size < MAX_COOKIE_SIZE_IN_BYTES) return false;

				bigCookies.set(c.name, c);
				return true;
			});
			const duplicatedCookies: string[] = findDuplicates(
				traces.cookies.map(c => c.name)
			);
			const score = Number(
				bigCookies.size === 0 && duplicatedCookies.length === 0
			);

			const meta = util.successOrFailureMeta(CookieOptimisation.meta, score);
			debug('done');

			const cookiesBySize =
				bigCookies.size > 0
					?
					Array.from(bigCookies.values()).map(c => {
						return { name: c.name, size: c.size };
					})
					: undefined;

			return {
				meta,
				score,
				scoreDisplayMode: 'binary',
				...(cookiesBySize || duplicatedCookies.length
					? {
						extendedInfo: {
							value: {
								...(cookiesBySize
									? {
										size: cookiesBySize
									}
									: {}),
								...(duplicatedCookies.length > 0
									? {
										dup: duplicatedCookies
									}
									: {})
							}
						}
					}
					: {})
			};
		}

		debug('skipping non applicable audit');
		return {
			meta: util.skipMeta(CookieOptimisation.meta),
			scoreDisplayMode: 'skip'
		};
	}
}
