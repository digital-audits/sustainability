export default class Audit {
	static get meta(): SA.Audit.Meta {
		return {} as SA.Audit.Meta;
	}

	static audit(
		traces: SA.Traces.Traces
	):
		| Promise<SA.Audit.Result | SA.Audit.SkipResult | undefined>
		| SA.Audit.Result
		| SA.Audit.SkipResult
		| undefined {
		return {} as SA.Audit.Result | SA.Audit.SkipResult;
	}
}
