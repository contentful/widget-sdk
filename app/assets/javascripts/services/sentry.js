'use strict';

angular.module('contentful').factory('sentry', [
         '$injector', '$window', 'environment', 'stringifySafe',
function ($injector ,  $window ,  environment, stringifySafe) {

  var GET_MAX_LENGTH = 1800;

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
      userId: $injector.get('authentication').getUser().sys.id,
      git_revision: environment.settings.git_revision
    }});
    options.merge.apply(options, arguments);
    options = options.value();
    var charCount = 0;
    var charPerKey;
    if(options.extra){
      for(var key in options.extra){
        options.extra[key] = stringifySafe(options.extra[key]);
        charCount += options.extra[key].length;
      }
      if(charCount > GET_MAX_LENGTH){
        charPerKey = _.parseInt(GET_MAX_LENGTH / _.keys(options.extra).length);
        for(var key in options.extra){
          options.extra[key] = options.extra[key].substr(0, charPerKey);
        }
      }
    }
    return options;
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
    },

    captureServerError: function (message, error, options) {
      if ($window.Raven) {
        $window.Raven.captureMessage(message, createOptions({
          tags: {
            type: 'server_error'
          },
          extra: {
            error: error
          }
        }, options));
      }
    }
  };
}]);
