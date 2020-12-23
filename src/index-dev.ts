import {stdout} from 'process';
import {Sustainability} from '.';

(async () => {
	Sustainability.auditStream.pipe(process.stdout);
	await Sustainability.audit('https://audits.digital', {
		connectionSettings: {streams: true}
	});
})();
