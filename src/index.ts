import Sustainability from './sustainability/sustainability'

const sustainability = new Sustainability()
const url = 'https://susaudits.web.app';

(async function main(){
    await sustainability.audit(url)
})()
