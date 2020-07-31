import {Sustainability} from '.';

(async () => {
	console.log(
		JSON.stringify(await Sustainability.audit('https://www.toptal.com'))
	);
})();
