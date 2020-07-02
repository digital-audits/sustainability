import {Sustainability} from './index'

const url = 'https://www.example.org';

(async () =>   {
    const report = await Sustainability.audit(url);
    console.log(report)
})();
