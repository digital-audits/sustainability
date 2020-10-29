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
	CollectFailedTransferTraces
} from '../types/traces';
import {CollectorsIds, PassContext} from '../types/audit';
import {ConnectionSettingsPrivate} from '../types/settings';

export default class Collect {
	public static collectId: CollectorsIds;
	public static passContext: PassContext
	public static debug: CallableFunction
	static get id() {
		return this.collectId;
	}
	static get context(){
		return this.passContext
	}
	static get debugObject(){
		return this.debug
	}

	collect(pageContext: PageContext, settings: ConnectionSettingsPrivate) {
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
			| undefined
		>;
	}
}
