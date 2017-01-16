Debug tools
===========

We have some custom tools for debugging certain features. You can find them
under `src/debug`. These tools are only available in `development`, `preview`
and `staging` environments.

A tool name (prefixed with two underscores) is available as a function in
global namespace - you can call it from developer console.

List of debug tools
-------------------
- __ANALYTICS_CONSOLE - a simple front-end tool that allows to intercept and
show data sent to Segment. See [Analytics guide][analytics].
- __MOCK_XHR - mocks XHR request, allowing to set responce status codes for
given urls.

[analytics]: /docs/guides/analytics

Creating a new debug tool
-------------------------

To add a new debug tool, create a service that exports one `show()` function,
and add reference to it to `src/debug/debug.js`

