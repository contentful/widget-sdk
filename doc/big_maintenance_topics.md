# Big UI Maintenance Topics

## Promises  
Use Promises in the client library and subsequently everywhere in the user interface by providing an AngularJS specific adapter.

Since AngularJS at its core is based on Promises, this opens up a _lot_ of potential for cleaning up and improving things.

## Identify design problems in tests
Currently writing and maintaining the tests for the user interface is a bit of a pain since a lot of or components have APIs that are awkward to test and require a lot of mocking and boilerplate setup to test the actual functionality.

We want to audit the tests to identify common problems and solve them. This will benefit from using Promises since those are easier to integrate in the Angular testing environment.

We also need to better use features provided by recent versions of Jasmine and Sinon.

Currently the UI test suite takes about a minute to run. This is mostly the fault of directive tests that perform many slow DOM operations. There is probably potential for speeding this up.

## Deployment/infrastructure
Move away from Rails and investigate Javascript based deployment solutions:
- Browserify
- Broccoli
- Atomify
- Gulp
- Grunt
- Closure Compiler

This should help improve build times during development and re-enable the usage of live-reload for CSS development.

Should we decide to use the Closure Compiler, the added type safety and the potential for minification would be a huge win. AngularJS itself is built with the Closure Compiler.

The move away from Rails asset pipeline is a requirement to be able to move away from Capybara. Capybara has become totally useless for us.

## Integration Tests
Switch from Capybara to Karma, the canonical AngularJS Test runner.

## CSS refactoring
Check the [associated document](docs/css_refactoring.md)
