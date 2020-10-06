import { PageContext } from "../types";
import { ConnectionSettingsPrivate } from "../types/settings";
import Collect from "./collect";
import * as util from '../utils/utils'
import { CollectCookiesTraces } from "../types/traces";


export default class CollectCookies extends Collect {
    collectId='cookiescollect'
    static get id(){
        return this.collectId
    }

    static async collect(
        pageContext:PageContext,
        settings:ConnectionSettingsPrivate
    ): Promise<CollectCookiesTraces | undefined>
    {
        try{
        const debug = util.debugGenerator('Cookies collect')
        debug('running')
        const {page} = pageContext
        await util.safeNavigateTimeout(page, 'networkidle0', settings.maxNavigationTime, debug)
        const cookieJar = await page.cookies()
        return {
            cookies:cookieJar
        }

    }catch(e){
        util.log(e)
        return undefined
    }
        
        
    }
}