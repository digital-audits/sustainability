import { PageContext } from '../types/index';
export default class Collect {
    static collectId: SA.Audit.CollectorsIds;
    static get id(): SA.Audit.CollectorsIds;
    collect(pageContext: PageContext): SA.Traces.CollectHtmlTraces | SA.Traces.CollectAssetsTraces | SA.Traces.CollectImagesTraces | SA.Traces.CollectConsoleTraces | SA.Traces.CollectRedirectTraces | SA.Traces.CollectSubfontsTraces | SA.Traces.CollectTransferTraces | SA.Traces.CollectPerformanceTraces | SA.Traces.CollectFailedTransferTraces;
}
