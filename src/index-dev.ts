import { Sustainability } from '.';

(async () => {
	Sustainability.auditStream.pipe(process.stdout);
	await Sustainability.audit('https://sitepoint.com', {
		connectionSettings: { streams: true, coldRun: true }
	});



})();
