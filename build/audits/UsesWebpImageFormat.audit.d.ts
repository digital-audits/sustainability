import Audit from './audit';
export default class UsesWebpImageFormatAudit extends Audit {
    static get meta(): SA.Audit.Meta;
    /**
     *
     * @param traces SA.DataLog.TransferTraces
     * Get image format using the MIME/type (header: content-type)
     * WebP should be used against PNG, JPG or GIF images
     */
    static audit(traces: SA.Traces.Traces): SA.Audit.Result;
}
