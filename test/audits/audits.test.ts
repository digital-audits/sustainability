import CookieOptimisation from "../../src/audits/CookieOptimisation.audit"
import { Traces } from "../../src/types/traces"

describe('CookieOptimisation Audit', ()=>{
    it('works (applicable)', async ()=>{
        const traces = {
            hosts:['localhost'],
            cookies:[
                {
                    name:'fatCookie', 
                    value:'true', 
                    domain:'localhost',
                    expires:-1,
                    httpOnly:false,
                    path:'/',
                    secure:false,
                    session:true,
                    size:1030
                },
                {
                    name:'dupCookie', 
                    value:'true', 
                    domain:'localhost',
                    expires:-1,
                    httpOnly:false,
                    path:'/',
                    secure:false,
                    session:true,
                    size:55
                },
                {
                    name:'dupCookie', 
                    value:'true', 
                    domain:'localhost',
                    expires:-1,
                    httpOnly:false,
                    path:'/',
                    secure:false,
                    session:true,
                    size:55
                }
            ]
        } as Traces
        const auditResult = await CookieOptimisation.audit(traces)
        expect(auditResult?.extendedInfo?.value.size).toEqual([{name:'fatCookie', size:1030}])
        expect(auditResult?.extendedInfo?.value.dup).toEqual(['dupCookie'])
    })
})