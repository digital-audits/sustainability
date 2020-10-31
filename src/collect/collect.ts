import {PageContext} from '../types';
import {
	CollectHtmlTraces,
	CollectAssetsTraces,
	CollectMediaTraces,
	CollectConsoleTraces,
	CollectRedirectTraces,
	CollectSubfontsTraces,
	CollectTransferTraces,
	CollectPerformanceTraces,
	CollectFailedTransferTraces,
	CollectLazyMediaTraces,
	CollectMetaTagsTraces,
	CollectScreenShotTraces,
	CollectCookiesTraces,
	CollectAnimationsTraces,
	CollectRobotsTraces
} from '../types/traces';
import {CollectMeta, CollectorsIds, PassContext} from '../types/audit';
import {ConnectionSettingsPrivate} from '../types/settings';

export default class Collect {
	public static collectId: CollectorsIds;
	public static passContext: PassContext;
	public static debug: CallableFunction;

	static get meta() {
		return {} as CollectMeta;
	}

	static async collect(
		pageContext: PageContext,
		settings: ConnectionSettingsPrivate
	) {
		return {} as Promise<
			| CollectHtmlTraces
			| CollectAssetsTraces
			| CollectMediaTraces
			| CollectConsoleTraces
			| CollectRedirectTraces
			| CollectSubfontsTraces
			| CollectTransferTraces
			| CollectPerformanceTraces
			| CollectFailedTransferTraces
			| CollectLazyMediaTraces
			| CollectMediaTraces
			| CollectMetaTagsTraces
			| CollectScreenShotTraces
			| CollectCookiesTraces
			| CollectAnimationsTraces
			| CollectRobotsTraces
			| undefined
		>;
	}
}
