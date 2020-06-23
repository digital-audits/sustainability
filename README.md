# Website Sustainability Audits
  Currently in beta release. Test your website at [sustainability](https://susaudits.web.app/) (with environmental awareness)

## Instructions to run locally

1. Git clone the stable branch
2. Run npm install on the local folder. This will download all dependencies listed in package.json, including a chromium      browser compatible with the latest Puppeteer version (~123MB).
3. Redis is needed. Download the library from source https://redis.io/topics/quickstart or docker it. Make sure it is running on port 6379.
4. Run the script npm run dev, which will launch the server listening at localhost:7200. You can set an environment variable to PORT to change the port value. 
  - Test the server’s health with a GET request at /health, 
  - or run a new job with a POST request at /service/add including a JSON body param ‘url’ containing the corresponding URL       to audit.
  
Feel free to change the configuration at /src/config to suit your needs.

## Live demo

Visit [sustainability](https://susaudits.web.app/) to test the software.

## Contributions

This is open-source software. I highly encourage everyone interested to help pushing up this project. 

