import { LaunchOptions, Browser } from 'puppeteer';
declare class Connection {
    private launchSettings;
    setUp(launchSettings?: LaunchOptions): Promise<Browser>;
}
declare const _default: Connection;
export default _default;
