import { AuditSettings } from '../types/index';
export default class Sustainability {
    static audit(url: string, options?: AuditSettings): Promise<{
        globalScore: number;
        meta: {
            id: string;
            url: string;
            timing: number[];
        };
        audits: SA.Audit.AuditsByCategory[];
    }>;
    private startNewConnectionAndReturnBrowser;
    private handler;
}
