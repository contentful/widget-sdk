'use strict';

angular.module('contentful').factory('logger', ['$injector', function ($injector) {
  var $window        = $injector.get('$window');
  var environment    = $injector.get('environment');
  var stringifySafe  = $injector.get('stringifySafe');

  function onServiceReady() {
    if($window.Bugsnag){
      setUserInfo();
      $window.Bugsnag.appVersion = environment.settings.git_revision;
    }
  }

  function setUserInfo() {
    var authentication = $injector.get('authentication');
    var user = authentication.getUser();
    if(dotty.exists(user, 'sys.id') && !$window.Bugsnag.user){
      $window.Bugsnag.user = {
        id: dotty.get(user, 'sys.id'),
        firstName: dotty.get(user, 'firstName'),
        lastName: dotty.get(user, 'lastName'),
      };
    }
  }

  function rand(length, current){
   current = current ? current : '';

   return length ? rand( --length , '0123456789ABCDEFabcdef'.charAt( Math.floor( Math.random() * 22 ) ) + current ) : current;
  }

  function getRoute() {
    //avoiding circular dependency
    var routing = $injector.get('routing');
    return routing.getRoute();
  }

  function getParams() {
    var route = getRoute();
    var params = _.pick(route.params, 'spaceId', 'entryId', 'contentTypeId', 'apiKeyId');
    return _.extend(params, {
      viewport: ''+$window.innerWidth+'x'+$window.innerHeight,
      screensize: ''+$window.screen.width+'x'+$window.screen.height
    });
  }

  // extra metadata is shown in Bugsnag's "custom" tab
  function getMetadata(extra) {
    return _.extend({
      params: getParams(),
    }, addDataId(extra || {}));
  }

  function addDataId(options) {
    var dataId = null;
    if(options && options.data){
      dataId = logDataObject(preParseData(options.data));
      options.dataId = dataId;
      delete options.data;
    }
    return options;
  }

  function logDataObject(data) {
    var id = rand(64);
    var $http = $injector.get('$http');
    $http.post(environment.settings.dataLoggerUrl+id, data);
    return id;
  }

  function preParseData(data) {
    var prop;
    for(var key in data){
      prop = data[key];
      data[key] = JSON.parse(stringifySafe(prop)||'{}');
    }
    return data;
  }

  return {
    onServiceReady: onServiceReady,

    logDataObject: logDataObject,

    logException: function (exception, extra) {
      if($window.Bugsnag){
        setUserInfo();
        $window.Bugsnag.notifyException(exception, getMetadata(extra));
      }
    },

    logError: function (message, options) {
      if ($window.Bugsnag) {
        setUserInfo();
        $window.Bugsnag.notify('Logged Error', message, getMetadata(options), 'error');
      }
    },

    logServerError: function (message, error, options) {
      if ($window.Bugsnag) {
        options = options || {};
        options.error = error;
        setUserInfo();
        $window.Bugsnag.notify('Logged Server Error', message, getMetadata(options), 'error');
      }
    },

    logWarn: function (message, options) {
      if ($window.Bugsnag) {
        setUserInfo();
        $window.Bugsnag.notify('Logged Warning', message, getMetadata(options), 'warning');
      }
    },

    log: function (message, options) {
      if ($window.Bugsnag) {
        setUserInfo();
        $window.Bugsnag.notify('Logged Info', message, getMetadata(options), 'info');
      }
    }

  };
}]);
