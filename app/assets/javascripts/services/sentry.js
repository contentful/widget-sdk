'use strict';

angular.module('contentful').factory('sentry', [
         '$injector', '$window', 'environment', 'stringifySafe',
function ($injector , $window, environment, stringifySafe) {

  function rand(length, current){
   current = current ? current : '';

   return length ? rand( --length , "0123456789ABCDEFabcdef".charAt( Math.floor( Math.random() * 22 ) ) + current ) : current;
  }

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
    return options.value();
  }

  function logDataObject(data) {
    var $http = $injector.get('$http');
    var id = rand(64);
    $http.post(environment.settings.dataLoggerUrl+id, data);
    return id;
  }

  function preParseData(data) {
    var prop;
    for(var key in data){
      prop = data[key];
      if(prop && prop.$id && prop.$apply && prop.$digest){
        data[key] = JSON.parse(stringifySafe(prop));
      }
    }
    return data;
  }

  return {
    logDataObject: logDataObject,
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
        var dataId = null;
        if(options.data){
          dataId = logDataObject(preParseData(options.data));
          options.extra = options.extra || {};
          options.extra.dataId = dataId;
          delete options.data;
        }

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
