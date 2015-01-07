'use strict';

angular.module('contentful').factory('logger', ['$injector', function ($injector) {
  var $window        = $injector.get('$window');
  var environment    = $injector.get('environment');
  var stringifySafe  = $injector.get('stringifySafe');
  var toJsonReplacer = $injector.get('toJsonReplacer');

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
        adminLink: getAdminLink(user),
        organizations: getOrganizations(),
      };
    }
  }

  function getOrganizations() {
    var authentication = $injector.get('authentication');
    var user = authentication.getUser();
    var organizationNames = _.map(user.organizationMemberships, function(m){
      return m.organization.name;
    });
    return organizationNames.join(', ');
  }

  function getAdminLink(user) {
    var id = dotty.get(user, 'sys.id');
    return 'https://admin.'+environment.settings.main_domain+'/admin/users/'+id;
  }

  function getRoute() {
    //avoiding circular dependency
    var routing = $injector.get('routing');
    return routing.getRoute();
  }

  function getParams() {
    var route = getRoute();
    return _.extend({}, 
      route.params,
      route.pathParams,
      {
        viewport: ''+$window.innerWidth+'x'+$window.innerHeight,
        screensize: ''+$window.screen.width+'x'+$window.screen.height
      });
  }

  function augmentMetadata(metaData) {
    metaData = metaData ? metaData : {};
    // params tab
    _.extend(metaData, {
      params: getParams()
    });
    // data tab
    if (metaData.data) {
      metaData.data = preParseData(metaData.data);
    }
    return metaData;
  }

  function preParseData(data) {
    var prop;
    for(var key in data){
      prop = data[key];
      data[key] = JSON.parse(stringifySafe(prop)||'{}', toJsonReplacer);
    }
    return data;
  }

  return {
    onServiceReady: onServiceReady,

    logException: function (exception, metaData) {
      if($window.Bugsnag){
        setUserInfo();
        var augmented = _.extend({severity: 'error'}, augmentMetadata(metaData));
        $window.Bugsnag.notifyException(exception, null, augmented);
      }
    },

    tabChanged: function(){
      if ($window.Bugsnag) $window.Bugsnag.refresh();
    },

    logError: function (message, metaData) {
      this._log('Logged Error', 'error', message, metaData);
    },

    logServerError: function (message, metaData) {
      this._log('Logged Server Error', 'error', message, metaData);
    },

    logWarn: function (message, metaData) {
      this._log('Logged Warning', 'warning', message, metaData);
    },

    log: function (message, metaData) {
      this._log('Logged Info', 'info', message, metaData);
    },

    _log: function(type, severity, message, metaData) {
      if ($window.Bugsnag) {
        metaData = metaData || {};
        metaData.groupingHash = metaData.groupingHash || message;
        setUserInfo();
        $window.Bugsnag.notify(type, message, augmentMetadata(metaData), severity);
      }
    }

  };
}]);
