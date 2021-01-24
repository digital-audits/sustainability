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

<p>
<details><summary>Running with renewable energy</summary><br/>
Is it using an eco-friendly hosting solution powered with renewable energy? It will look it up for you.
</details>
<details><summary>Carbon footprint</summary><br/>
What is its carbon footprint and how does it compare with others? It will look it up for you.
</details>
<details><summary>HTTP/2.0</summary><br/>
Is it really using HTTP/2.0 protocol? It will look it up for you.
</details>
<details><summary>Text compression</summary><br/>
Is it compressing all of its text data? It will look it up for you.
</details>
<details><summary>Bot traffic</summary><br/>
Is it preventing bots from wasting its bandwidth? It will look it up for you.
</details>
<details><summary>Cookie optimisation</summary><br/>
Are its cookies optimised and fairly sized? It will look it up for you.
</details>
<details><summary>Browser caching</summary><br/>
Is it taking fully advantage of browser caching? Is it wasting resources? It will look it up for you.
</details>
<details><summary>URL redirects</summary><br/>
Is it wasting resources with URL redirects? It will look it up for you.
</details>

### Design Audits

Targets the website assets that convert code to user consumable content.

<details><summary>WebP images</summary><br/>
Is it using the lightweight but powerful WebP image format on its images? It will look it up for you.
</details>
<details><summary>WebM videos</summary><br/>
Is it using the WebM video format on its videos? It will look it up for you.
</details>
<details><summary>Lazy loading on media</summary><br/>
Is it lazily loading its media assets so they are only downloaded on demand? It will look it up for you.
</details>
<details><summary>Font subsetting</summary><br/>
Is it subseting its fonts to only contain the necessary chars? It will look it up for you.
</details>
<details><summary>Console logs</summary><br/>
Is it handling the error and warning console logs or simply ignoring them? It will look it up for you.
</details>
<details><summary>Pixel energy efficiency</summary><br/>
Is it considering the energy produced by each pixel for displaying its contents? It will look it up for you.
</details>
<details><summary>Dark mode</summary><br/>
Does it have a dark mode theme to save energy? It will look it up for you.
</details>
<details><summary>Reactive CSS animations</summary><br/>
Is it implementing some logic to stop/display animations on demand? It will look it up for you.
</details>
<details><summary>Inline assets</summary><br/>
Is it inlining big JS and CSS assets and thus preventing the browser from storing those in memory? It will look it up for you.
</details>
</p>

## Installation

<details><summary>Installation steps</summary>

Install puppeteer (if you don't already have it installed):

`npm i puppeteer`

Install sustainability locally:

`npm i sustainability`

Install sustainability CLI:

`npm i -g sustainability`

</details>

## Usage

<details><summary>Locally</summary>


Take as example the following code:

```js
const { Sustainability } = require("sustainability");

const url = "https://www.example.org";

(async () => {
  const report = await Sustainability.audit(url);
  console.log(report);
})();
```
</details>
<details><summary>CLI</summary>

`sustainability [opts] url`<br/>
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
</details>
<details><summary>Docker</summary>

You can docker a chromium browser (e.g [docker alpine chrome](https://github.com/Zenika/alpine-chrome)) and run the audits by specifying a path with the `CHROME_BIN` environmental variable.

```bash
# Linux
CHROME_BIN=path_to_chrome_bin node index.js
```
</details>

## Debugging

<details><summary>Debugging steps</summary>

You can enable verbose logging to see the API in action.
This is done by setting the `DEBUG` environmental variable to `sustainability:*.` or with the `-d` option in the CLI.

For example:

```bash
# Linux
DEBUG=sustainability:* node index.js
# Windows Powershell
$env:DEBUG=sustainability:* node index.js
```
</details>

## API

### class: Sustainability

Sustainability module provides a method to run the sustainability audits on a URL.

<p>
<details><summary>Sustainability.audit(URL, settings)</summary><br/>


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
  </details>
  <details><summary>Sustainability.auditStream</summary><br/>

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

</details>
</p>

## With a server

Typically you would like sustainability to process the maximum number of processes at the same time. One way to do this, is implementing a queue management system with a set of service workers. To see a full working example with sustainability, please refer to [this repo](https://github.com/sirdmon/sustainable).

## Give it a spin

Visit [DAS site](https://audits.digital/) to test the software with **environmental awareness**.


## FAQS

<details><summary>Oh wow, what's the story behind this? Did you just sit down and make this one day?</summary><br/>

There is a short and a long history.

The short history is that the ICT in the worst case scenario will be responsible for 1/4 of the world's energy demand in the next 10 years and I'm not alone on this [external ref](https://www.nature.com/articles/d41586-018-06610-y).

This is due to a faster digital transformation, a data-oriented society and a higher availability in developing countries.

Knowing the adverse situation we are facing, I think that we can do much more to make sure our digital services engage with sustainability issues.

The long history is that I can tell you from my first-hand experience that currently, we are not teaching our professionals to build a responsible and sustainable digital world, and neither we are consuming them with this in mind.

Hopefully this tool will trigger the right actions in both sides.

</details>

<details><summary>I’d like to learn more about this topic. Would you be able to share articles or research?</summary><br/>

This was initially part of my own [master's degree thesis work](http://dx.doi.org/10.13140/RG.2.2.31368.44809). <br/>
Also, I had lately added some interesting research and insights [here](https://github.com/digital-audits/sustainability/blob/master/RESEARCH.md).

</details>


## Contributions are welcomed

This is open-source software. I highly encourage everyone interested to help pushing up this project.\
Core development? Join the team! Make sure you read first the [contributions-dev notes.](https://github.com/digital-audits/sustainability/blob/master/CONTRIBUTION-dev.md)\
Found and issue, visibility, business aspects, sharing your thoughts? [Open a new issue](https://github.com/digital-audits/sustainability/issues/new)\
Sponsoring? Help us to keep the project running in [Open Collective](https://opencollective.com/das).

[puppeteer]: https://github.com/GoogleChrome/puppeteer "Puppeteer"
[puppeteer.launch]: https://github.com/GoogleChrome/puppeteer/blob/v1.5.0/docs/api.md#puppeteerlaunchoptions "puppeteer.launch"
[page]: https://github.com/GoogleChrome/puppeteer/blob/v1.5.0/docs/api.md#class-page "Page"
[browser]: https://github.com/puppeteer/puppeteer/blob/v1.5.0/docs/api.md#class-browser "Browser"
