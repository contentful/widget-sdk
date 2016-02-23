'use strict';

/**
 * @ngdoc module
 * @name contentful/app
 */
angular.module('contentful/app', ['contentful'])

.config(function(){
  if (!history.pushState) {
    // Strip invalid hash so $location does not trip up
    // when we call the page with #access_token=foo
    if (window.location.hash.match(/^#(?:$|[^!])|^$/)) {
      window.location.hash = '!/' + window.location.hash;
    }
  }
})

.run([
  'authentication', 'clientAdapter', 'ShareJS', 'uiVersionSwitcher',
  function(authentication, clientAdapter, ShareJS, uiVersionSwitcher) {
  authentication.login();
  clientAdapter.token = authentication.token;
  ShareJS.connect(authentication.token);
  uiVersionSwitcher.checkIfVersionShouldBeSwitched();
}]);
