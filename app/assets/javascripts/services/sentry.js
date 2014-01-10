'use strict';

angular.module('contentful').factory('sentry', [
         '$injector', '$window', 'environment', 'stringifySafe',
function ($injector , $window, environment, stringifySafe) {

  function rand(length, current){
   current = current ? current : '';

   return length ? rand( --length , '0123456789ABCDEFabcdef'.charAt( Math.floor( Math.random() * 22 ) ) + current ) : current;
  }

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
    var params = _.pick(route.params, 'spaceId', 'entryId', 'contentTypeId', 'apiKeyId');
    return params;
  }

  function createOptions() {
    var url = getUrl();
    var user = $injector.get('authentication').getUser();
    var options = {
      'culprit': url,
      logger: 'user_interface',
      tags: getParams()
    };

    options = _(options);
    options.merge({tags: {
      userId: user && user.sys.id,
      git_revision: environment.settings.git_revision,
      viewport: ''+$window.innerWidth+'x'+$window.innerHeight,
      screensize: ''+$window.screen.width+'x'+$window.screen.height
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
      if(prop && prop.$evalAsync && prop.$watch){
        data[key] = JSON.parse(stringifySafe(prop));
      }
    }
    return data;
  }

  return {
    logDataObject: logDataObject,

    /*
     * options is an object
     * If it contains a data key, that value is processed, sent to google cloud
     * and the id is assigned to options.extra.
     * Use it to log full objects in sentry
     */
    captureError: function (error, options) {
      if ($window.Raven) {
        var dataId = null;
        if(options && options.data){
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

    captureException: function (exception, options) {
      if ($window.Raven) {
        $window.Raven.captureException(exception, createOptions({
          tags: {
            type: 'exception'
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
