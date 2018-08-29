const URL = require('url');

module.exports.create = function create(manifest, base) {
  return function resolve(url) {
    const urlObj = URL.parse(URL.resolve(base + '/', url));
    if (urlObj.protocol) {
      return url;
    }
    const fingerprinted = manifest[urlObj.pathname.substr(1)];
    if (!fingerprinted) {
      throw new Error(`Could not get fingerprinted path for "${url}"`);
    }
    // fingerprinted might be a relative path
    urlObj.pathname = URL.resolve('/', fingerprinted);
    return URL.format(urlObj);
  };
};
