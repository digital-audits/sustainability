# Contribution-dev notes

- [Understanding the architecture](#Understanding-the-architecture)
- [Extending the collectors](#Extending-the-collectors)
- [Extending the audits](#Extending-the-audits)
- [Clone locally](#Clone-locally)

## Understanding the architecture

![DAS architecture](https://github.com/digital-audits/sustainability/blob/master/architecture.png)

I- Each job has its own commander instance which controls the collectors, parsers and
evaluators.
Initially, the worker handovers a job to the commander instance. 

II- This creates two parallel threads, one for navigation and another for collecting the traces. The navigation consists of launching a headless chromium browser controlled by Puppeteer. 

III- Collectors are scripts whose aim is to collect valuable metrics from the navigation and transform them to traces that contain the processed information.
Collectors run in parallel threads and asynchronously because some of them have to wait for navigational
events to dispatch. Transfer, css, js or images are examples of existing collectors.
Then, a parser role is to catch errors and transform collected pieces of information to a format consumable to
audits (i.e. traces)

IV- Audits are splitted into two categories and also running in parallel and have their own
format. They include a meta function containing the audit’s id, description, failure and success titles,
thresholds, etc., and a method to evaluate traces regarding the established thresholds and eventually, a
score is calculated which may be in a binary or numeric format. Optionally and depending on the audit
typology, the testimonials can be appended to the output so as to provide extra information and reasoning
about the result.
Once all audits are finished, their output is re-parsed in the commander instance and a report object is built
comprising a meta block containing a global score from 0 to 100 and an audit block divided into server and
design categories and sorted by passes or failed audits. A score is also computed per category.

## Extending the collectors

#### Implement your own collector

If you are not ok with the current developed collectors you can easily create one yourself.
This is done by creating a `collect/example.collector.ts` that extends from the `Collector.ts` class.

Take a look at the following example:

```js
export default class CollectPerformance extends Collect {
	collectId: CollectorsIds = 'performancecollect';
   
	static get id() {
		return this.collectId;
	}
    
	static async collect(
		pageContext: PageContext,
		settings: ConnectionSettingsPrivate
	): Promise<CollectPerformanceTraces> {  //Create the types of your collector traces in `types/audit.ts`
		const {page} = pageContext;         // Your collector will always be called with the PageContext and ConnectionSettingsPrivate objects.
		await util.safeNavigateTimeout(page, 'load', settings.maxNavigationTime);
		const perf: Performance = await page.evaluate(() => performance.toJSON());
		const metrics: Metrics = await page.metrics();
		const info = {
			perf,
			metrics
		};

		return {
			performance: info
		};
	}
}

```


Finally, you need to append the newly created collector to collectors containing array.
This is done by changing the `settings/settings.ts` file:

```js
AUDITS: {
  collectors: [
  ...
  CollectPerformance  // <--Add your new collector here
  ]
  ...
}
```

#### Working with the app's utils

Those are the [utils](https://github.com/digital-audits/sustainability/blob/master/src/utils/utils.ts) you can take advantage of while working on your own collector implementation. 
Basically, you may use the `safeNavigationTimeout` which is an implementation of the `page.waitForNavigation()` Puppeteer's method but with a customable timeout that does not crashes the app.
Also you may use the `debugGenerator` to create a new debug object.

Feel free to add your own developed utils to `utils/utils.ts`

#### Injecting scripts to the page window object

Puppeteer enables the injection of scripts to the window object that you make use of in your own collector with `page.evaluate`.

In order to do so, firstly you need to place your script . (js | ts) in the `src/bin` folder.

Once there, you need to call the `page.evaluateOnNewDocument` method in `commander/commander.ts` file. 
Take a look at how this is done:

```js

class Commander {

	async setUp(
		pageContext: PageContext,
		settings?: ConnectionSettings
	): Promise<Page> {

    ...
    page.evaluateOnNewDocument(
	  fs.readFileSync(
	    path.resolve(__dirname, '../bin/your-script.js'),
		  'utf8'
	  )
	)
   )
}
```

You can also add any dependencies your script might have.

Install your dependency with `npm install` and simply add it.

```js
page.evaluateOnNewDocument(
  fs.readFileSync(require.resolve('some-dep'), 'utf8')
)
```

## Extending the audits

Similarly to extending the collectors, you can roll out your own audit implementation by creating a `audits/example.audit.ts` that extends from the `Audits.ts` class.

Take a look at the following example:

```js

export default class PerformanceAudit extends Audit {

    const MAX_JS_DURATION_TIME = 4000  //a threshold that will determine the audit's result

	static get meta() {
		return {
			id: 'performance',
			title: `Your Success title`,
			failureTitle: `Your Failure title`,
			description: `Your audit description`,
			category: 'server | design', //which category it belongs to
			collectors: ['performancecollect'] //the collector types it needs
		} as Meta;
	}

	static async audit(traces: Traces): Promise<Result> {
        const JSDurationTime = traces.performance.metrics['ScriptDuration']

        const score = Number(JSDurationTime <= MAX_JS_DURATION_TIME)
        const meta = util.successOrFailureMeta(PerformanceAudit.meta)

        return {
            meta,
            score,
            scoreDisplayMode: 'numeric'
        }
     }
   }
```

#### Adding audit applicability

Now imagine the traces you seek for your audit are not available in the analyzed URL.
You can easily fix this by adding all the required logic to your audit to assess whether or not the audit should apply.
In our previous example..

```js
    ...
    static async audit(traces: Traces): Promise<Result> {

        const JSDurationTime = traces.performance.metrics['ScriptDuration']
        const isAuditApplicable = ():boolean ==> {
            if( JSDurationTime){
                return true
               }

            return false
        }

        if (isAuditApplicable()){

            const score = Number(JSDurationTime <= MAX_JS_DURATION_TIME)
            const meta = util.successOrFailureMeta(PerformanceAudit.meta)

            return {
                meta,
                score,
                scoreDisplayMode: 'numeric'
            }
        }
            //Non-applicable Audit
            return {
			  meta: util.skipMeta(PerformanceAudit.meta),
			  scoreDisplayMode: 'skip'
		    };
        
     }
    ...
```

Finally, you need to append the newly created audit to audits containing array.
This is done by changing the `settings/settings.ts` file:

```js
AUDITS: {
  audits: [
	...
    PerformanceAudit // <--Add your new audit here
  ]
	},
```

## Clone locally
Make sure to fetch the latest release from Master branch.

**1- Git clone**

`git clone https://github.com/digital-audits/sustainability`

**2- cd to folder**

`cd sustainability/`

**3- npm install**

`npm i`

 If you dont have already puppeteer locally install it with:

`npm i puppeteer`




