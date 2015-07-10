'use strict';

/**
 * @ngdoc service
 * @name logger
 * @description
 * Service used to log errors and exceptions.
 * At the moment this is mostly based on Bugsnag.
 * See the Bugsnag service and https://bugsnag.com/docs/notifiers/js for more details
*/
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
    /**
     * @ngdoc method
     * @name logger#enable
     * @description
     * Enables the logger service
     * any 3rd party services running
    */
    enable: function(){
      bugsnag.enable();
    },

    /**
     * @ngdoc method
     * @name logger#disable
     * @description
     * Disables the logger service because of customers who wish to not have
     * any 3rd party services running
    */
    disable: function(){
      bugsnag.disable();
      _.forEach(this, function(value, key){
        this[key] = _.noop;
      }, this);
    },

    /**
     * @ngdoc method
     * @name logger#logException
     * @description
     * Mostly used by the $uncaughtException service
     * @param {Error} Exception Error object
     * @param {Object} Metadata object. Can take any of the expected bugsnag metadata parameters.
     * @param.data  {Object} Additional data (other objects). Shows up on the bugsnag data tab.
    */
    logException: function (exception, metaData) {
      setUserInfo();
      bugsnag.notifyException(exception, null, augmentMetadata(metaData), 'error');
    },

    /**
     * @ngdoc method
     * @name logger#logError
     * @description
     * Log with error level
     * @param {String} Error message.
     * @param {Object} Metadata object. Can take any of the expected bugsnag metadata parameters.
     * @param.data  {Object} Additional data (other objects). Shows up on the bugsnag data tab.
     * @param.error {Object} Error object. Shows up on the bugsnag error tab.
    */
    logError: function (message, metaData) {
      this._log('Logged Error', 'error', message, metaData);
    },

    /**
     * @ngdoc method
     * @name logger#logWarn
     * @description
     * Log with warn level
     * @param {String} Error message.
     * @param {Object} Metadata object. Can take any of the expected bugsnag metadata parameters.
     * @param.data  {Object} Additional data (other objects). Shows up on the bugsnag data tab.
     * @param.error {Object} Error object. Shows up on the bugsnag error tab.
    */
    logWarn: function (message, metaData) {
      this._log('Logged Warning', 'warning', message, metaData);
    },

    /**
     * @ngdoc method
     * @name logger#logServerError
     * @description
     * Log an error from the Contentful API with error level
     * @param {String} Error message.
     * @param {Object} Metadata object. Can take any of the expected bugsnag metadata parameters.
     * @param.data  {Object} Additional data (other objects). Shows up on the bugsnag data tab.
     * @param.error {Object} Error object. Shows up on the bugsnag error tab.
    */
    logServerError: function (message, metaData) {
      if (dotty.get(metaData, 'error.statusCode') === 0) {
        this._logCorsWarn(message, metaData);
      } else {
        this._log('Logged Server Error', 'error', message, flattenServerErrors(metaData));
      }
    },

    /**
     * @ngdoc method
     * @name logger#logServerWarn
     * @description
     * Log an error from the Contentful API with warn level
     * @param {String} Error message.
     * @param {Object} Metadata Can take any of the expected bugsnag metadata parameters.
     * @param.data  {Object} Additional data (other objects). Shows up on the bugsnag data tab.
     * @param.error {Object} Error object. Shows up on the bugsnag error tab.
    */
    logServerWarn: function (message, metaData) {
      if (dotty.get(metaData, 'error.statusCode') === 0) {
        this._logCorsWarn(message, metaData);
      } else {
        this._log('Logged Server Warning', 'warning', message, flattenServerErrors(metaData));
      }
    },

    /**
     * @ngdoc method
     * @name logger#logSharejsError
     * @description
     * Log an error specific to ShareJS with error level
     * @param {String} Error message.
     * @param {Object} Metadata Can take any of the expected bugsnag metadata parameters.
     * @param.data  {Object} Additional data (other objects). Shows up on the bugsnag data tab.
     * @param.error {Object} Error object. Shows up on the bugsnag error tab.
    */
    logSharejsError: function (message, metaData) {
      this._log('Logged ShareJS Error', 'error', message, metaData);
    },

    /**
     * @ngdoc method
     * @name logger#logSharejsWarn
     * @description
     * Log an error specific to ShareJS with warn level
     * @param {String} Error message.
     * @param {Object} Metadata Can take any of the expected bugsnag metadata parameters.
     * @param.data  {Object} Additional data (other objects). Shows up on the bugsnag data tab.
     * @param.error {Object} Error object. Shows up on the bugsnag error tab.
    */
    logSharejsWarn: function (message, metaData) {
      this._log('Logged ShareJS Warning', 'warning', message, metaData);
    },

    /**
     * @name logger#_logCorsWarn
     * @description
     * Log detected CORS warnings
     * @param {String} Error message.
     * @param {Object} Metadata Can take any of the expected bugsnag metadata parameters.
     * @param.data  {Object} Additional data (other objects). Shows up on the bugsnag data tab.
     * @param.error {Object} Error object. Shows up on the bugsnag error tab.
    */
    _logCorsWarn: function(message, metaData) {
      this._log('CORS Warning', 'warning', message, metaData);
    },

    /**
     * @name logger#_log
     * @description
     * Log a message to the bugsnag wrapper.
     * @param {String} Error type, mostly used for grouping on bugsnag.
     * @param {String} Severity level.
     * @param {String} Error message.
     * @param {Object} Metadata Can take any of the expected bugsnag metadata parameters.
     * @param.data  {Object} Additional data (other objects). Shows up on the bugsnag data tab.
     * @param.error {Object} Error object. Shows up on the bugsnag error tab.
    */
    _log: function(type, severity, message, metaData) {
      metaData = metaData || {};
      metaData.groupingHash = metaData.groupingHash || message;
      setUserInfo();
      bugsnag.notify(type, message, augmentMetadata(metaData), severity);
    }

  };
}]);
