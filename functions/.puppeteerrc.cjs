const {join} = require('path');

/**
 * @type {import("puppeteer").Configuration}
 */
module.exports = {
  // Configures the cache location for Puppeteer
  cacheDirectory: join(__dirname, '/tmp', 'puppeteer_cache'),
};
