import {PageContext} from '../types';

export default class Collect {
	public static collectId: SA.Audit.CollectorsIds;
	static get id() {
		return this.collectId;
	}

	collect(pageContext: PageContext) {
		return {} as
			| SA.Traces.CollectHtmlTraces
			| SA.Traces.CollectAssetsTraces
			| SA.Traces.CollectImagesTraces
			| SA.Traces.CollectConsoleTraces
			| SA.Traces.CollectRedirectTraces
			| SA.Traces.CollectSubfontsTraces
			| SA.Traces.CollectTransferTraces
			| SA.Traces.CollectPerformanceTraces
			| SA.Traces.CollectFailedTransferTraces;
	}
}
