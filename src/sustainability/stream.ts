import {Readable} from 'stream'


export const reportStream = new Readable({
    objectMode:true,
    read() {}
})

reportStream.pipe(process.stdout)

