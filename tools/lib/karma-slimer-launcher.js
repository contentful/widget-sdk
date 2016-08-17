import * as FS from 'fs'
import * as P from 'path'

export default {'launcher:SlimerJS': ['type', SlimerJSBrowser]}

SlimerJSBrowser.$inject = ['baseBrowserDecorator']

function SlimerJSBrowser (baseBrowserDecorator) {
  baseBrowserDecorator(this)

  this._start = function (url) {
    // Create the js file that will open Karma
    const captureFile = P.join(this._tempDir, '/capture.js')
    const captureCode =
      `var page = require("webpage").create();
       page.open("${url}");`
    FS.writeFileSync(captureFile, captureCode)
    this._execCommand(this._getCommand(), [captureFile])
  }
}

SlimerJSBrowser.prototype = {
  name: 'SlimerJS',

  DEFAULT_CMD: {
    linux: 'bin/slimerjs',
    darwin: 'bin/slimerjs'
  }
}
