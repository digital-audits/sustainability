import { Sustainability } from '.';

(async () => {
	Sustainability.auditStream.pipe(process.stdout);
	await Sustainability.audit('https://www.example.org', {
		connectionSettings: { streams: false, coldRun: true }
	});



})();
