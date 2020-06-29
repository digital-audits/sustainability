import Collect from './collect';
import { PageContext } from '../types/index';
export default class CollectConsole extends Collect {
    collectId: SA.Audit.CollectorsIds;
    static get id(): SA.Audit.CollectorsIds;
    static collect(pageContext: PageContext): Promise<SA.Traces.CollectConsoleTraces | undefined>;
}
