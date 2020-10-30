import {Readable} from 'stream'


export const auditStream = new Readable({
    objectMode:true,
    read() {}
})


