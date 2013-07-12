'use strict';

angular.module('contentful').factory('sentry', [
         '$injector', '$window', 'authentication', 'environment',
function ($injector ,  $window ,  authentication,   environment) {

  function getRoute() { //avoiding circular dependency
    var routing = $injector.get('routing');
    return routing.getRoute();
  }

  function getUrl() {
    var route = getRoute();
    var path = route.viewType || '';
    return $window.location.protocol+'//'+$window.location.host + '/' + path;
  }

  function getParams() {
    var route = getRoute();
    return _.pick(route.params, 'spaceId', 'entryId', 'contentTypeId', 'apiKeyId');
  }

  function createOptions() {
    var url = getUrl();
    var options = {
      'culprit': url,
      logger: 'user_interface',
      tags: getParams()
    };

    options = _(options);
    options.merge({tags: {
      userId: authentication.getUser().sys.id,
      git_revision: environment.settings.git_revision
    }});
    options.merge.apply(options, arguments);
    return options.value();
  }

  return {
    captureException: function (exception, options) {
      if ($window.Raven) {
        $window.Raven.captureException(exception, createOptions({
          tags: {
            type: 'exception'
          }
        }, options));
      }
    },

    captureError: function (error, options) {
      if ($window.Raven) {
        $window.Raven.captureMessage(error, createOptions({
          tags: {
            type: 'error_message'
          }
        }, options));
      }
    }
  };
}]);
