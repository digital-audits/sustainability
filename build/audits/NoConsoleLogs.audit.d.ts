import Audit from './audit';
export default class NoConsoleLogsAudit extends Audit {
    static get meta(): SA.Audit.Meta;
    static audit(traces: SA.Traces.Traces): SA.Audit.Result;
}
