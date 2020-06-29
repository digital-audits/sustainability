import Audit from './audit';
export default class UsesCompressionAudit extends Audit {
    static get meta(): SA.Audit.Meta;
    static audit(traces: SA.Traces.Traces): SA.Audit.Result | undefined;
}
