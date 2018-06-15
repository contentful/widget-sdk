# Technical Debt

This is a list of technical debt in the code base. Technical debt includes:
* libraries and modules to avoid,
* code hotspots that need constant improvement, and
* deprecated programming patterns

If you come across code that you see as technical debt then please record it
here. If the debt is localized it suffices to put a `TODO` comment into the code
outlining the issues and possible improvements.

## `@contentful/client` library

This library is used to communicate with the CMA. It has proved to be a bad fit
for our purposes and hard to maintain.

Specifically you should avoid the `space` property from the `spaceContext`
module and any object representing a content type, entry, or asset that has
persistence methods on it.

## `spaceContext` service

This service should be used with great care and, if possible, improvements
should be made to it. It has a couple of problems

* It is a stateful module that depends on the currently selected space. In
  particular, any of its properties may be set to `null` when a space switch
  occurs.
* The module has 23 dependencies
* It has a couple of entity helpers methods that should be extracted. Those
  methods deal with projecting data from entities like `entryTitle`.
* It is responsible for managing draft content types. This should be extracted

## Modules with global state

We should avoid modules with global state. If possible we should separate the
stateful methods and have them created by factories. The object can be
instantiated where needed. The following is a list of modules with global state
that should be rewritten

* `spaceContext`
* `accessChecker`
* `widgets` and `widgets/Store`
* `data/previewEnvironmentCache`
