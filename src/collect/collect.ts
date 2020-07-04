import {PageContext} from '../types';
import { CollectHtmlTraces, CollectAssetsTraces, CollectImagesTraces, CollectConsoleTraces, CollectRedirectTraces, CollectSubfontsTraces, CollectTransferTraces, CollectPerformanceTraces, CollectFailedTransferTraces } from '../types/traces';
import { CollectorsIds } from '../types/audit';

export default class Collect {
	public static collectId:CollectorsIds;
	static get id() {
		return this.collectId;
	}

	collect(pageContext: PageContext) {
		return {} as
			| CollectHtmlTraces
			| CollectAssetsTraces
			| CollectImagesTraces
			| CollectConsoleTraces
			| CollectRedirectTraces
			| CollectSubfontsTraces
			| CollectTransferTraces
			| CollectPerformanceTraces
			| CollectFailedTransferTraces;
	}
}
