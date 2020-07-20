import {PageContext} from '../types';
import {
	CollectHtmlTraces,
	CollectAssetsTraces,
	CollectImagesTraces,
	CollectConsoleTraces,
	CollectRedirectTraces,
	CollectSubfontsTraces,
	CollectTransferTraces,
	CollectPerformanceTraces,
	CollectFailedTransferTraces
} from '../types/traces';
import {CollectorsIds} from '../types/audit';
import {ConnectionSettingsPrivate} from '../types/settings';

export default class Collect {
	public static collectId: CollectorsIds;
	static get id() {
		return this.collectId;
	}

	collect(pageContext: PageContext, settings: ConnectionSettingsPrivate) {
		return {} as Promise<
			| CollectHtmlTraces
			| CollectAssetsTraces
			| CollectImagesTraces
			| CollectConsoleTraces
			| CollectRedirectTraces
			| CollectSubfontsTraces
			| CollectTransferTraces
			| CollectPerformanceTraces
			| CollectFailedTransferTraces
			| undefined
		>;
	}
}
