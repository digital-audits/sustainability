import {Sustainability} from './index';

(async () => {
    console.log(JSON.stringify(await Sustainability.audit('https://audits.digital')))

})()