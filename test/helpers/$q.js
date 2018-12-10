/**
 * This module acts as an adapter for angular’s $q service.
 *
 * It uses the `$q` instance from the current test cases angular
 * injector. This means that you need to load a module with
 * `module('contentful/test')` first.
 *
 * This allows application ES6 modules that import `$q` to be imported
 * as ES6 modules in tests.
 *
 * ~~~js
 * import $q from 'test/helpers/$q'
 * // Imports '$q', too
 * import * as C from `utils/Concurent`
 *
 * describe(function () {
 *   beforeEach(function () {
 *     module('contentful/test')
 *   })
 *
 *   it('works', function () {
 *     $q.resolve()
 *     // ...
 *   })
 * })
 * ~~~
 *
 * This module is aliased to the module ID `$q` in `test/system-config.js`.
 */
export default function $q(...args) {
  return get$q()(...args);
}

$q.resolve = wrap('resolve');
$q.reject = wrap('reject');
$q.defer = wrap('defer');
$q.all = wrap('all');

function wrap(method) {
  return (...args) => get$q()[method](...args);
}

function get$q() {
  let $q;
  inject(_$q_ => {
    $q = _$q_;
  });
  return $q;
}
