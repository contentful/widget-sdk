import * as URL from 'url'

export function create (manifest, base) {
  return function resolve (url) {
    var urlObj = URL.parse(URL.resolve(base + '/', url))
    if (urlObj.protocol) {
      return url
    }
    var fingerprinted = manifest[urlObj.pathname.substr(1)]
    if (!fingerprinted) {
      throw new Error(`Could not get fingerprinted path for "${url}"`)
    }
    // fingerprinted might be a relative path
    urlObj.pathname = URL.resolve('/', fingerprinted)
    return URL.format(urlObj)
  }
}
