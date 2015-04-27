'use strict';

/**
 * @ngdoc module
 * @name contentful/app
 */
angular.module('contentful/app', ['contentful'])
.config(['analyticsProvider', 'environment', function(analyticsProvider, environment){
  $.cookies.setOptions({
    secure: environment.env != 'development'
  });

  if (!history.pushState) {
    // Strip invalid hash so $location does not trip up
    // when we call the page with #access_token=foo
    if (window.location.hash.match(/^#(?:$|[^!])|^$/)) {
      window.location.hash = '!/' + window.location.hash;
    }
  }

  //analyticsProvider.forceLoad();
}])
.run(['authentication', 'clientAdapter', 'ShareJS', 'analytics', 'logger', function(authentication, clientAdapter, ShareJS) {
  authentication.login();
  clientAdapter.token = authentication.token;
  ShareJS.connect();
}]);
