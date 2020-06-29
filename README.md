# Digital sustainability audits
> A de facto standard to evaluate sustainability in web pages. Computes the carbon footprint index, determines the energy source of servers, the usage of HTTP2.0, WebP image format, lazy loading on images, font subsetting, etc. Effectively generates a customized report.

- [Installation](#Installation)
- [Usage](#Usage)
- [Debugging](#Debugging)
## What does it do

You supply a valid and reachable URL, maybe one that you have just finished to build or is already live, and evaluates the use given to the resources from a sustainability point of view.

Under the hood it relies on the excellent
[puppeteer library](https://github.com/GoogleChrome/puppeteer) which uses the Headless Chrome Node API, maintained by the Google Chrome team.  

## What does it audit

Audits are divided into two categories: server and design.

### Server audits

Server aspects which are essential for online sustainability.

* Running with renewable energy
* Carbon footprint
* Uses HTTP2
* Uses content encoding

### Design Audits

Targets the website assets that convert code to user consumable content.

* Uses WebP images
* Uses lazy loading on images
* Uses font subsetting
* No console logs

## Installation

Install puppeteer (if you don't already have it installed):

`npm install puppeteer`

Install sustainability:

`npm install sustainability`

## Usage

Take as example the following code:

```js
const {Sustainability} = require('sustainability');

const url = 'https://www.example.org';

(async () =>   {
    const report = await Sustainability.audit(url);
    console.log(report)
})();
```
Which produces the following report object:

```js
{
  globalScore: 88,
  meta: {
    id: '4c21fbb0-ba35-11ea-bd32-09a6ce997b13',
    url: 'https://www.example.org',
    timing: [ 1593454566154, 1593454568225 ]
  },
  audits: [
    { category: [Object], score: 75, audits: [Object] },
    { category: [Object], score: 100, audits: [Object] }
  ]
}
```
## Debugging

You can enable verbose logging to see the API in action.
This is done by setting the DEBUG environmental variable to `sustainability:*.`
You can see the example below or refer to the [debug docs](https://github.com/visionmedia/debug#windows-command-prompt-notes) for more information.

```bash
# Linux
DEBUG=sustainability:*
# Windows Powershell
$env:DEBUG=sustainability:*
```


## Give it a spin

Visit [DAS](https://audits.digital/) to test the software with **environmental awareness**.

## Contributions

This is open-source software. I highly encourage everyone interested to help pushing up this project.
