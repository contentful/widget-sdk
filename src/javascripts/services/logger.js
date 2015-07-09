'use strict';

angular.module('contentful').factory('logger', ['$injector', function ($injector) {
  var $window        = $injector.get('$window');
  var bugsnag        = $injector.get('bugsnag');
  var environment    = $injector.get('environment');
  var stringifySafe  = $injector.get('stringifySafe');
  var toJsonReplacer = $injector.get('toJsonReplacer');

  function setUserInfo() {
    var authentication = $injector.get('authentication');
    var user = authentication.getUser();
    if(dotty.exists(user, 'sys.id') && bugsnag.needsUser()){
      bugsnag.setUser({
        id: dotty.get(user, 'sys.id'),
        firstName: dotty.get(user, 'firstName'),
        lastName: dotty.get(user, 'lastName'),
        adminLink: getAdminLink(user),
        organizations: getOrganizations(),
      });
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

  function getState() {
    //avoiding circular dependency
    var rootScope      = $injector.get('$rootScope');
    return {
      name: rootScope.$state.current.name,
      params: rootScope.$stateParams
    };
  }

  function getParams() {
    var state = getState();
    return _.extend({}, 
      {
        state: state.name
      },
      state.params,
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

  function flattenServerErrors(err) {
    var flattened = dotty.get(err, 'body') || err;
    if(flattened.details && flattened.details.reasons) {
      flattened.reasons = _.clone(flattened.details.reasons);
      delete flattened.details.reasons;
    }
    return flattened;
  }

  return {
    enable: function(){
      bugsnag.enable();
    },

    disable: function(){
      bugsnag.disable();
      _.forEach(this, function(value, key){
        this[key] = _.noop;
      }, this);
    },

    logException: function (exception, metaData) {
      setUserInfo();
      bugsnag.notifyException(exception, null, augmentMetadata(metaData), 'error');
    },

    tabChanged: function(){
      bugsnag.refresh();
    },

    logError: function (message, metaData) {
      this._log('Logged Error', 'error', message, metaData);
    },

    logWarn: function (message, metaData) {
      this._log('Logged Warning', 'warning', message, metaData);
    },

    logServerError: function (message, metaData) {
      if (dotty.get(metaData, 'statusCode') === 0) {
        this._logCorsWarn(message, metaData);
      } else {
        this._log('Logged Server Error', 'error', message, flattenServerErrors(metaData));
      }
    },

    logServerWarn: function (message, metaData) {
      if (dotty.get(metaData, 'statusCode') === 0) {
        this._logCorsWarn(message, metaData);
      } else {
        this._log('Logged Server Warning', 'warning', message, flattenServerErrors(metaData));
      }
    },

    logSharejsError: function (message, metaData) {
      this._log('Logged ShareJS Error', 'error', message, metaData);
    },

    logSharejsWarn: function (message, metaData) {
      this._log('Logged ShareJS Warning', 'warning', message, metaData);
    },

    _logCorsWarn: function(message, metaData) {
      this._log('CORS Warning', 'warning', message, metaData);
    },

    _log: function(type, severity, message, metaData) {
      metaData = metaData || {};
      metaData.groupingHash = metaData.groupingHash || message;
      setUserInfo();
      bugsnag.notify(type, message, augmentMetadata(metaData), severity);
    }

  };
}]);
