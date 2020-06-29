import Audit from './audit';
export default class UsesGreenServerAudit extends Audit {
    static get meta(): SA.Audit.Meta;
    static audit(traces: SA.Traces.Traces): Promise<SA.Audit.Result | undefined>;
}
