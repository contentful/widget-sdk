Writing ES6
===========

Angular services can now be written using ES6 syntax and are transpiled with
[Babel][babel].

ES6 transpilation is enabled for files with the `.es6.js` extension. See the
[ES6 Modules](#es6-modules) section for more info on how to integrate ES6 code
with Angular.

We use the [`es2015` preset][es2015-preset] with the `loose` option and the
SystemJS transform for ES6 modules.

ES6 syntax is not yet supported for directives and controllers.

[babel]: http://babeljs.io/
[es2015-preset]: http://babeljs.io/docs/plugins/preset-es2015/


Adding a Transform Plugin
-------------------------

To add support for an ES6 feature one needs to adjust the Babel configuration
and the ESLint configuration. The babel configuration is located in
`tools/app-babel-options.js`

Be sure to prefer the `loose` option for plugins if available. This will create
less correct code but it will be more portable without using polyfills.


Linting
-------

We have to different ESLint configurations for ES5 and ES6 files defined in `./eslintrc.yml`.

The ES6 configuration excludes ES6 syntax that is not transformed through the
[`no-restricted-syntax` rule][no-restricted-syntax-rule]. If you add a Babel
plugin make sure to also update the ESLint configuration.

We use `npm run hint` to lint the whole application manually. You can integrate eslint with your IDE. [Integration List](https://eslint.org/docs/user-guide/integrations#editors)

[no-restricted-syntax-rule]: http://eslint.org/docs/rules/no-restricted-syntax


ES6 Modules
-----------

The ES6 module syntax (using the keywords `import` and `export`) is transpiled
into code that is then plugged into Angular’s DI module system.

Assume the file `src/javascripts/a/b/x.es6.js` has the following export
~~~js
export default const def = 'default'
export const foo = 'foo'
~~~
This file is transformed into an Angular service with its name `a/b/x` derived
from the file name. Thus, from Angular we can import this file as follows.
~~~js
var X = $injector.get('a/b/x')
assert.equal(X.default, 'default')
assert.equal(X.foo, 'foo')
~~~

Conversely, we can import Angular services in ES6 modules.
~~~js
import * as X from 'x'
~~~
is equivalent to
~~~
var X = $injector.get('x')
~~~

We also support relative imports. Assume the file `src/javascripts/a/b/x.es6.js`
has the following import.
~~~js
import * as Y from '../y'
import * as Z from './z'
~~~
Imports are resolved relative to the module ID (which coincides with the service
name) of the file they are used in. Since the file above has the module ID
`a/b/c` this is equivalent to
~~~js
var Y = $injector.get('a/y')
var Z = $injector.get('a/b/z')
~~~

The implementation uses the [SystemJS Babel plugin][babel-systemjs] and is
provided in `src/javascripts/prelude.js`.

All files in the `test` directory are treated as ES6 modules by default. However
they are not integrated into Angular which means that they can only import
native ES6 modules. See the [Testing Guide](./testing.md#module-system) for more
information.


[babel-systemjs]: http://babeljs.io/docs/plugins/transform-es2015-modules-systemjs/
