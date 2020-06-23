import {safeReject} from '../helpers/safeReject';
import {PageContext} from '../types/cluster-settings';

export class Collect {
	public id:string=''
	collect(pageContext: PageContext): any {}

	static parseAllSettled(data: any, audit?: boolean): any {
		const parser = (res: any) => {
			if (res.status === 'fulfilled' && res.value) {
				return res.value;
			}

			if (res.status === 'rejected') {
				safeReject(new Error(`Failed with error: ${res.reason}`));
			}
		};

		const result = data.map((res: any) => {
			return parser(res);
		});

		if (!audit) {
			return Object.assign({}, ...result);
		}

		return result
			.filter((data: any) => data)
			.flatMap((data: any) => {
				const isArray = Array.isArray(data);
				if (isArray) {
					return data.map((d: any) => d.value);
				}

				return data;
			});
	}
}
