Debug tools
===========

We have some custom tools for debugging certain features. These tools are only
available in `development`, `preview` and `staging` environments.

A debug tool can be enabled by calling `cfDebug.toolName()` from the browser
console.

Existing Tools
--------------

### `cfDebug.analytics()`

Calling this function will show a window that logs calls to `analytics.track()`.

Can also be called as `cfDebug.analytics({showData: true})` to initially show all event data.

Development
-----------

The source code for debug tools is located in the `src/javascripts/debug` folder.

To add a debug tool create a new folder or file in `debug` and add your logic.
Each tool must have an entry module that has an initializer as the default
export. The initializer may return an object with an additional debugging API.

The entry module is then added to the `module` variable in
`src/javascripts/Debug.es6.js`. This will expose the tool on `cfDebug`.