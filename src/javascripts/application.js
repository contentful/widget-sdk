'use strict';

/**
 * @ngdoc module
 * @name contentful/app
 */
angular.module('contentful/app', ['contentful'])

.config(function () {
  if (!history.pushState) {
    // Strip invalid hash so $location does not trip up
    // when we call the page with #access_token=foo
    if (window.location.hash.match(/^#(?:$|[^!])|^$/)) {
      window.location.hash = '!/' + window.location.hash;
    }
  }
})

// .config(['environment', '$compileProvider', function (environment, $compileProvider) {
  // TODO temporarily disabled because it breaks `element.scope()`
  // which we use in a couple of places.
  // if (environment.env === 'production') {
  //   $compileProvider.debugInfoEnabled(false);
  // }
// }])

.run(['$injector', function ($injector) {
  var get = $injector.get;
  var authentication = get('authentication');
  authentication.login();

  get('clientAdapter').setToken(authentication.token);
  get('ShareJS').connect(authentication.token);
  get('uiVersionSwitcher').checkIfVersionShouldBeSwitched();
}]);
