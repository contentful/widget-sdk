import * as FS from 'fs'
import {entries} from 'lodash'
import * as P from 'path'

export default {'launcher:Firefox': ['type', FirefoxLauncher]}

FirefoxLauncher.$inject = ['baseBrowserDecorator']
FirefoxLauncher.prototype = { name: 'Firefox' }

function FirefoxLauncher (baseBrowserDecorator) {
  baseBrowserDecorator(this)

  this._start = function (url) {
    const slimerBin = P.resolve('vendor/slimerjs/slimerjs-0.10.3/slimerjs')

    const profilePath = P.join(this._tempDir, 'profile')
    FS.mkdirSync(profilePath)
    writeUserPrefs(profilePath, {
      'focusmanager.testmode': true
    })

    const captureFile = P.join(this._tempDir, 'capture.js')
    const captureCode =
      `var page = require("webpage").create();
       page.open("${url}");`
    FS.writeFileSync(captureFile, captureCode)

    this._execCommand(slimerBin, [
      '-profile', profilePath,
      captureFile
    ])
  }
}

function writeUserPrefs (profileDir, userPrefs) {
  const content = entries(userPrefs).map(([key, value]) => {
    return `user_pref("${key}", ${JSON.stringify(value)});\n`
  }).join('')
  FS.writeFileSync(P.join(profileDir, 'prefs.js'), content)
}
