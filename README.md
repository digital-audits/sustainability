# Digital sustainability audits
> A de facto standard to evaluate sustainability in web pages. Computes the carbon footprint index, determines the energy source of servers, the usage of HTTP2.0, WebP image format, lazy loading on images, font subsetting, etc. Effectively generates a customized report.
## What does it do

You supply a valid and reachable URL, maybe one that you have just finished to build or is already live, and evaluates the use given to the resources from a sustainability point of view.

Under the hood it relies on the excellent
[puppeteer library](https://github.com/GoogleChrome/puppeteer) which uses
the Headless Chrome Node API, maintained by the Google Chrome team.   

## Live demo

Visit [DAS](https://audits.digital/) to test the software.

## Contributions

This is open-source software. I highly encourage everyone interested to help pushing up this project.
