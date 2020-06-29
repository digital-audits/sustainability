import { Page } from 'puppeteer';
import { PageContext } from '../types/index';
declare class Commander {
    private settings;
    private readonly audits;
    private tracker;
    setUp(pageContext: PageContext, settings?: SA.Settings.ConnectionSettings): Promise<Page>;
    navigate(pageContext: PageContext): Promise<void>;
    asyncEvaluate(pageContext: PageContext): Promise<Array<Promise<any>>>;
}
declare const _default: Commander;
export default _default;
