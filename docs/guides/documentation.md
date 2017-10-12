Writing Documentation
=====================

This guide explains how to write code documentation for the app.

## Syntax

We use [JSDoc][jsdoc] style documentation: Documentation strings
start with `/**\n` an end with ` */`. Tags starting with `@` are used to provide
structure to documentation.

To keep things simple we restrict ourselves to the following tags

* [`@description`](http://usejsdoc.org/tags-description.html)
* [`@deprecated`](http://usejsdoc.org/tags-deprecated.html)
* [`@module`](http://usejsdoc.org/tags-module.html)
* [`@param`](http://usejsdoc.org/tags-param.html)
* [`@returns`](http://usejsdoc.org/tags-returns.html)
* [`@type`](http://usejsdoc.org/tags-type.html)


## Function

Documentation is required for exported functions and encouraged for private
functions.

~~~javascript
/**
 * @description
 * One sentence of summary.
 *
 * More detailed explanation
 *
 * @param {string[]} items  Inline description
 * @param {string} options.foo
 *   Notation for nested objects
 * @param {boolean} options.bar
 * @param {string?} flag
 *   Optional parameter
 *
 * @returns {Promise<boolean>}
 */
export function (items, options, flag) { ... }
~~~

The description of a function should start with a one-sentence summary. Then
follows a more detailed description of what the function does.

Do not explain how the function is implemented. This is of no relevance to the
user and belongs into the function body.

All non structured text is treated as markdown. For readability, prefer indented
code blocks over `~~~` fences

If possible, provide usage examples.


## Modules

Each module that exports more then one value should have a module documentation.

~~~javascript
/**
 * @module
 * @description
 * My module description
 */
~~~


## Type Expressions

We use TypeScript type expressions in the `@param`, `@returns`, and `@type`
tags. These look like this
~~~typescript
// basic types
string, number, boolean, object, any
// Arrays
string[], Array<string>
// Type constructors
Promise<string>
// Tuples
[string, number]
// Functions
(number, string) => object
// Nullable values
string?, Promise<object[]?>
~~~
