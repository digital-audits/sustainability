import Audit from './audit';
import * as util from '../utils/utils';
import {Traces} from '../types/traces';
import {Meta, SkipResult, Result} from '../types/audit';
/**
 * @fileoverview Audits if compression is used. Instead of looking for the content encoding
 *  Response header, which may not reflect the origin server configuration if it serves
 *  the files over a CDN, it takes both compressed and uncompressed file sizes, calculates
 *  the compression ratio and comapres it to the threshold.
 */

const debug = util.debugGenerator('UsesCompression Audit');
const RATIO_THRESHOLD = 0.95;
const APPLICABLE_COMPRESSION_MIME_TYPES = [
	'text/css',
	'application/javascript',
	'application/x-font-woff',
	'text/javascript',
	'text/html',
	'font/woff',
	'font/ttf',
	'application/json',
	'text/xml',
	'text/plain',
	'image/svg+xml',
	'image/x-icon'
];
export default class UsesCompressionAudit extends Audit {
	static get meta() {
		return {
			id: 'usescompression',
			title: 'Use compression',
			failureTitle: `Don’t use compression`,
			description: `Text compression is important because it reduces the total amount of data transferred to clients`,
			category: 'server',
			collectors: ['transfercollect', 'redirectcollect']
		} as Meta;
	}

	static audit(traces: Traces): Result | SkipResult | undefined {
		debug('running');
		const auditUrls = new Set();
		const compressionRatio = (compressed: number, uncompressed: number) =>
			Number.isFinite(compressed) && compressed > 0
				? compressed / uncompressed
				: 1;

		// Filter images and woff font formats.
		// js files considered secure (with identifiable content on HTTPS, e.g personal cookies ) should not be compressed (to avoid CRIME & BREACH attacks)
		let errorMessage: string | undefined;
		const {hosts} = traces;
		let justOneTime = true;
		const resources = traces.record
			.filter(record => {
				if (
					!APPLICABLE_COMPRESSION_MIME_TYPES.includes(
						record.response.headers['content-type']
					)
				)
					return false;

				const size = record.CDP.compressedSize.value;
				const unSize = record.response.uncompressedSize.value;
				const ratio = compressionRatio(size, unSize);
				if (ratio < RATIO_THRESHOLD) return false;

				return true;
			})
			.map(record => {
				const isNginx = () => {
					if (record.response.headers.server) {
						const server = record.response.headers.server;
						return server.toUpperCase().includes('NGINX');
					}

					return false;
				};

				const recordUrl = record.request.url;

				const isSameHost = hosts.includes(recordUrl.hostname);

				if (justOneTime && isSameHost && isNginx()) {
					errorMessage = `Possible low gzip compression level detected on NGINX server. Please, consider changing it to at least 5. <a href="https://nginx.org/en/docs/http/ngx_http_gzip_module.html">More info`;
					justOneTime = false;
				}

				let path = '';
				if (recordUrl.pathname) {
					path = recordUrl.pathname;

					if (path.length > 30) {
						path = path.slice(0, Math.max(0, path.indexOf('/', 2)));
					}
				}

				const trimUrl = recordUrl.hostname + path;

				return {
					url: trimUrl
				};
			})
			.filter(record => {
				if (auditUrls.has(record.url)) return false;
				auditUrls.add(record.url);
				return true;
			});

		const score = Number(resources.length === 0);
		const meta = util.successOrFailureMeta(UsesCompressionAudit.meta, score);
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
				: {}),
			...(errorMessage ? {errorMessage} : {})
		};
	}
}
