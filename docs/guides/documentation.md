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

API Documentation will only be generated for doc comments that have a
`@ngdoc <TYPE>` and `@name`. tag. Here *TYPE* is the type of documentation to
generate. Currently the following types are supported and will be
explained below.

There are three types that generate documentation for top-level objects:
`service`, `type` and `directive`. Each of these may have documentation of type
`method` or `property` attached. Both of them use the`@name` tag to refer to
their parent.

## Service

The `service` type documents the collection of methods and properties exported
by an Angular service.

~~~js
/**
 * @ngdoc service
 * @name path/to/service
 */
factory('path/to/service', function () {
  return {
    /**
     * @ngdoc method
     * @name path/to/service#create
     */
    create: create
  }
})
~~~

In some cases the object exported by a service may be used as a parameter in
other functions. In that case the service object should be documented as a
`type` and the service declared to export that type.
~~~js
/**
 * @ngdoc service
 * @name spaceContext
 * @type SpaceContext
 */
~~~


## Type

This documentation defines an abstract type.

It documents the shape of objects that are passed between functions. Types must
have UpperCamelCase names.

~~~js
/**
 * @ngdoc type
 * @name Person
 *
 * @property {string}     name
 * @method   {function()} invite
 */
~~~

You can use the `@param`, `@returns`, and `@type` tags to refer to a type.
~~~js
/**
 * @ngdoc method
 * @name createPerson
 * @returns {Person}
 */
~~~

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

Documentation with the `@ngdoc` type `method` or `property` are attached to the
documentation of a `service`, `directive` or `type`. The parent is determined by
the string preceding the `#` in the `@name` tag.

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
