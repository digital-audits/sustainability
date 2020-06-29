import Audit from './audit';
export default class UsesHTTP2Audit extends Audit {
    static get meta(): SA.Audit.Meta;
    /**
     * @param traces requiredTraces
     */
    static audit(traces: SA.Traces.Traces): SA.Audit.Result | undefined;
}
