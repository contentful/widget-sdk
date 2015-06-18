Writing Documentation
=====================

This guide explains how to build and write documentation for the app.
We currently generate documentation from the JavasScript code in the
`src/javascripts` directory.


## Using Documentation

To generate the documentation run `gulp docs` and then start the server
with `gulp serve`. You will be able to see the documentation under the
[`/docs`](http://app.joistio.com:8888/docs) folder in your development app.
To automatically re-generate your documentation when something changes,
run the `gulp docs/watch` task.


## Writing JS Documentation

~~~javascript
/**
 * @ngdoc directive
 * @name cfDirective
 *
 * @description
 * Description of this directive
 */
~~~

Each Doc Comment contains a number of tags starting with `@`. A tag’s
content starts at first white space after the tag name and ends when
the next tag begins.

API Documentation will only be generated for doc comments that have the
`@ngdoc type` tag. Here *type* is the type of documentation to
generate. Currently the following types are supported and will be
explained below.

* *module*
* *directive*
* *type*
* *method*
* *property*

## Directives

~~~javascript
/**
 * @ngdoc directive
 * @name cfDirective
 *
 * @description
 * Description of this directive
 *
 * @usage[html]
 * <div directive="hello">
 *
 * @scope.requires {string[]} data
 * The `$scope.data` property is required by the directive and it is
 * expected to be an array of strings.
 */
~~~

## Members

Documentation with the `@ngdoc` type `method` or `property` will be
attached to their parent document. The parent document’s is determined
by the string preceding the `#` in the `@name` tag.

~~~js
/**
 * @ngdoc method
 * @name SomeType#methodName
 *
 * @param {string} arg
 * @return {boolean}
 */
this.methodName = function(arg) {
  // body
}

/**
 * @ngdoc property
 * @name SomeType#state
 * @type {string}
 */
this.state = 'ready 2 rumble'
~~~

You can also inline method and property tags in the parent.
~~~js
/**
 * @ngdoc type
 * @name MyClass
 *
 * @property {string}     name
 * @method   {function()} go
 */
function MyClass() {
  this.name = 'myname'
  this.go = function() {}
}
~~~

## `@usage`

The usage tag renders code examples at the top of the documented
entity.

~~~js
/**
 * @ngdoc function
 * @name pirateify
 * @usage
 * pirateify('Hello')
 * // => 'Hello, arrrgh!'
 */
~~~

To enable syntax highlighting you can specifiy the language in brackets
like `@usage[js]` or `@usage[html]`

## Type Expressions

Type expressions are used by the `@param`, `@returns`, and `@scope.*`
tags, among others, to indicate a type. All type expressions must be
valid TypeScript type expressions. In the doc comments type expressions
are usually enclosed in braces.


## Hacking the System

*TODO* Explain how the documentation system works

### TODO

* Provide links to Github
* Link Types in type expressions (paramters, scope). A deep type linker
  would be nice: For compound type expressions such as `Array<MyType>`
  it links to `MyType`
* Examples in code doc
