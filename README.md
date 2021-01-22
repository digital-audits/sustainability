<h2 style="text-align: center;">
<img style="text-align: center;" src="https://raw.githubusercontent.com/digital-audits/sustainability/master/logo.png">
</h2>
 
# Digital sustainability audits

[![Sustainability](https://img.shields.io/badge/DAS%20verified%20sustainable-https://audits.digital-blue.svg?logo=data%3Aimage%2Fsvg%2Bxml%3Bbase64%2CPD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0iVVRGLTgiPz48c3ZnIHdpZHRoPSIxMDguNjVtbSIgaGVpZ2h0PSI5NS44NjZtbSIgdmVyc2lvbj0iMS4xIiB2aWV3Qm94PSIwIDAgMTA4LjY1IDk1Ljg2NiIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIiB4bWxuczpjYz0iaHR0cDovL2NyZWF0aXZlY29tbW9ucy5vcmcvbnMjIiB4bWxuczpkYz0iaHR0cDovL3B1cmwub3JnL2RjL2VsZW1lbnRzLzEuMS8iIHhtbG5zOnJkZj0iaHR0cDovL3d3dy53My5vcmcvMTk5OS8wMi8yMi1yZGYtc3ludGF4LW5zIyI%2BIDxtZXRhZGF0YT4gIDxyZGY6UkRGPiAgIDxjYzpXb3JrIHJkZjphYm91dD0iIj4gICAgPGRjOmZvcm1hdD5pbWFnZS9zdmcreG1sPC9kYzpmb3JtYXQ%2BICAgIDxkYzp0eXBlIHJkZjpyZXNvdXJjZT0iaHR0cDovL3B1cmwub3JnL2RjL2RjbWl0eXBlL1N0aWxsSW1hZ2UiLz4gICAgPGRjOnRpdGxlLz4gICA8L2NjOldvcms%2BICA8L3JkZjpSREY%2BIDwvbWV0YWRhdGE%2BIDxnIHRyYW5zZm9ybT0idHJhbnNsYXRlKC01MS4xNzkgLTc3LjkyMikiPiAgPHBhdGggZD0ibTEzMy40NCA3Ny45MjItNTcuNDQ5IDUwLjUzIDQyLjcwMiAxNC40MjYgNy4zMDQ1LTIwLjczNmM3LjE5MzYgMy4wMzQyIDEzLjY3NSA3LjYzMDEgMTkuMDA3IDEzLjQ3OHptMTEuNTY1IDU3LjY5OC0wLjQ1MDYyIDE3LjYxMy0yNS44NjEtMTAuMzU1LTIuMTY1MiA2LjE0NzQtMjcuMTQzLTkuNTYxMiAwLjM5Njg4IDExLjcxMS0xNC45OTgtOC45MDg1LTE0LjMwNiAwLjQ4NDcyYy01Ljk4MzIgOS4xNzI1LTkuMjE5MSAxOS45NjktOS4zMDIzIDMxLjAzNmgxMDguNjVjLTAuMTA2NjMtMTQuMjAzLTUuNDAwNy0yNy44MzktMTQuODE5LTM4LjE2OHptLTg0LjQ2OCAyNi44NjloOTEuNjM1YTQ4LjEyMiAzNy41MDggMCAwIDEgMi4zMDI3IDExLjE3OGgtOTYuMjRhNDguMTIyIDM3LjUwOCAwIDAgMSAyLjMwMjctMTEuMTc4eiIgZmlsbD0iIzAwMDA4MCIgZmlsbC1ydWxlPSJldmVub2RkIiBzdHJva2Utd2lkdGg9Ii4yNjQ1OCIvPiAgPHRleHQgZm9udC1mYW1pbHk9IidDZW50dXJ5IFNjaG9vbGJvb2sgTCciIGZvbnQtc2l6ZT0iMTkuNzU2cHgiIGZvbnQtd2VpZ2h0PSJib2xkIiBzdHlsZT0ibGluZS1oZWlnaHQ6MS4yNTtzaGFwZS1pbnNpZGU6dXJsKCNyZWN0MTgpO3doaXRlLXNwYWNlOnByZSIgeG1sOnNwYWNlPSJwcmVzZXJ2ZSIvPiA8L2c%2BPC9zdmc%2B&link=https://audits.digital&style=social)](https://audits.digital)
[![npm](https://badgen.now.sh/npm/v/sustainability)](https://www.npmjs.com/package/sustainability)
[![Build Status](https://travis-ci.org/digital-audits/sustainability.svg?branch=master)](https://travis-ci.org/digital-audits/sustainability)
[![Coverage Status](https://coveralls.io/repos/github/digital-audits/sustainability/badge.svg?branch=master)](https://coveralls.io/github/digital-audits/sustainability?branch=master)
[![Service](https://img.shields.io/badge/service-up-informational)](https://audits.digital)

> A de facto standard for the Internet carbon footprint. Computes the carbon footprint (CF) index, determines the energy source of servers, the usage of HTTP2.0, WebP image format, lazy loading on images, font subsetting, etc.
> Effectively generates a customized report. May cut down your site's CF up to the 70% (no kidding, research [here](https://github.com/digital-audits/sustainability/blob/master/RESEARCH.md)).

- [Installation](#Installation)
- [Usage](#Usage)
- [Debugging](#Debugging)
- [API](#API)
- [With a server](#with-a-server)
- [Give it a spin](#give-it-a-spin)
- [FAQS](#FAQS)
- [Contributions](#contributions-are-welcomed)

## What does it do

You supply a valid and reachable URL, maybe one that you have just finished to build or is already live, and evaluates the use given to the resources from a sustainability point of view.

Under the hood it relies on the excellent
[Puppeteer] library which uses the Headless Chrome Node API, maintained by the Google Chrome team.

## What does it audit

Audits are divided into two categories: server and design.

### Server audits

Server aspects which are essential for online sustainability.

- Running with renewable energy
- Carbon footprint
- HTTP2
- Text compression
- Bot traffic
- Cookie optimisation
- Browser caching
- URL redirects

### Design Audits

Targets the website assets that convert code to user consumable content.

- WebP images
- WebM videos
- Lazy loading on media
- Font subsetting
- Console logs
- Pixel energy efficiency
- Dark mode
- Reactive CSS animations

## Installation

Install puppeteer (if you don't already have it installed):

`npm i puppeteer`

Install sustainability locally:

`npm i sustainability`

Install sustainability CLI:

`npm i -g sustainability`

## Usage

### Locally

Take as example the following code:

```js
const { Sustainability } = require("sustainability");

const url = "https://www.example.org";

(async () => {
  const report = await Sustainability.audit(url);
  console.log(report);
})();
```

### CLI

`sustainability [opts] url`
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

### Docker

You can docker a chromium browser (e.g [docker alpine chrome](https://github.com/Zenika/alpine-chrome)) and run the audits by specifying a path with the `CHROME_BIN` environmental variable.

```bash
# Linux
CHROME_BIN=path_to_chrome_bin node index.js
```

## Debugging

You can enable verbose logging to see the API in action.
This is done by setting the `DEBUG` environmental variable to `sustainability:*.` or with the `-d` option in the CLI.

For example:

```bash
# Linux
DEBUG=sustainability:* node index.js
# Windows Powershell
$env:DEBUG=sustainability:* node index.js
```

## API

### class:Sustainability

Sustainability module provides a method to run the sustainability audits on a URL.

#### Sustainability.audit(URL, settings)

- `URL` <[string]> A valid and reachable URL to evaluate. **Warning**: You are responsible for providing a valid URL.
- `settings` <[Object]> Set of configurable settings for the audit. May include the following optional fields:
  - `browser` <[Browser]> Your own puppeteer's browser instance. If you set this options, the API won't spawn a browser instance. This may be useful if you want to make use of the `launch.connect(wsEndpoint)` method to remotely run a headless browser and pass it to the API. **Warning**: You will be responsible for handling the browser instance.
  - `launchSettings` <[Object]> passed to [puppeteer.launch]. Refer to [Puppeteer] documentation for more information. Defaults to `{}`.
  - `connectionSettings` <[Object]> Set of configurable connection settings. May include the following fields:
    - `maxNavigationTime`<[number]> Specifies a timeout in milliseconds (ms) for all the tasks. Defaults to 60000ms.
    - `maxScrollInterval` <[number]> Specifies the scrolling interval in milliseconds (ms) in the function that determines lazy loaded images. Defaults to 30ms.
    - `emulatedDevice` <[Object]> Set of emulated device settings. May include the following fields:
      - `userAgent` <[string]> A user-agent string.
      - `viewport` <[Object]> Set of viewport settings. May include the following fields:
        - `width` <[number]>
        - `height` <[number]>
      - `name` <[string]> Optional
      - `location` <[Object]> Set of location settings. May include the following fields:
        - `name` <[string]> The location name.
        - `latitude` <[number]> Latitude between -90 and 90
        - `longitude` <[number]> Longitude between -180 and 180
        - `accuracy`<[number]> Optional non-negative accuracy value
    - `coldRun` <[boolean]> Should initialise a cold run to find any potential URL redirect. Defaults to true.
    - `streams` <[boolean]> Should push individual audits results as they go. Defaults to false.

#### Sustainability.auditStream

A readable stream of audits to pipe from. Used in combination with streams option.

For example:

```js
(async () => {
  Sustainability.auditStream.pipe(process.stdout);
  await Sustainability.audit(url, {
    connectionSettings: { streams: true },
  });
})();
```

## With a server

Typically you would like sustainability to process the maximum number of processes at the same time. One way to do this, is implementing a queue management system with a set of service workers. To see a full working example with sustainability, please refer to [this repo](https://github.com/sirdmon/sustainable).

## Give it a spin

Visit [DAS](https://audits.digital/) to test the software with **environmental awareness**.

## Contributions are welcomed

This is open-source software. I highly encourage everyone interested to help pushing up this project.\
Core development? Join the team! Make sure you read first the [contributions-dev notes.](https://github.com/digital-audits/sustainability/blob/master/CONTRIBUTION-dev.md)\
Found and issue, visibility, business aspects, sharing your thoughts? [Open a new issue](https://github.com/digital-audits/sustainability/issues/new)\
Sponsoring? Help us to keep the project running in [Open Collective](https://opencollective.com/das).

[puppeteer]: https://github.com/GoogleChrome/puppeteer "Puppeteer"
[puppeteer.launch]: https://github.com/GoogleChrome/puppeteer/blob/v1.5.0/docs/api.md#puppeteerlaunchoptions "puppeteer.launch"
[page]: https://github.com/GoogleChrome/puppeteer/blob/v1.5.0/docs/api.md#class-page "Page"
[browser]: https://github.com/puppeteer/puppeteer/blob/v1.5.0/docs/api.md#class-browser "Browser"
