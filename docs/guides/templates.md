Templates
=========

This guide explains how to write the HTML templates that are used in Angular.

We use [Jade][] to define the templates we use in Angular directives.

~~~jade
//- .../my_directive.jade
div
  p Hello
  button Click Me
~~~

Templates are always refered to by their base file name.

~~~js
.directive('cfMyDirective', [function () {
  return {
    template: JST.my_directive()
  }
}])
~~~

[Jade]: http://jade-lang.org

Coding Guidelines
-----------------

* Avoid creating raw HTML strings in Javascript code. Prefer Jade templates.
* Prefer [Runtime interpolation](#runtime-interpolation) over interpolation with
  Angular.
* Keep templates [small and modular](#modularizing-templates) by using includes
  and mixins.


Runtime Interpolation
---------------------

~~~jade
span
  | Hello ${{name}}!
  | This {{name}} is interpolated by Angular!
~~~

~~~js
var tpl = JST.my_template({name: 'Luke'})
~~~

The interpolation is handeld by [`_.template`][lo.template] and only supports
simple variable names.

[lo.template]: https://github.com/lodash/lodash/blob/2.4.1/doc/README.md#_templatetext-data-options-optionsescape-optionsevaluate-optionsimports-optionsinterpolate-sourceurl-variable


Modularizing Templates
----------------------

Jade provides the
[`include`](http://jade-lang.com/reference/includes/) syntax to break templates
into reasonable chunks.

~~~jade
div
  | A lot of text...
  include ./toolbar
~~~

To reduce duplication in templates it is advised to use
[mixins](http://jade-lang.com/reference/mixins/) syntax to modularize
templates.


Mixins should only use the `attributes` syntax to receive parameters, never the
function argument syntax.

If a mixin can be used in more than one template it should be defined in a
separate file. The file must have the `.mixin.jade` extension.

~~~jade
// custom_button.mixin.jade
mixin custom-button
  button()&attributes(attributes)
    = attributes.label

// main.jade
include ./custom_button.mixin.jade
div
  +custom-button(label="click me" id="btn")
~~~


Build Process
-------------

Building the templates is handled by the `templates` gulp task.

1. Compile Jade files into HTML strings. This ues `gulp-jade`.
2. HTML strings are compiled into template functions by interpolating `${{ ... }}`. Uses `./tasks/build-template.js`
3. Collect these functions in the global `JST` object in the `templates.js`
   file.
