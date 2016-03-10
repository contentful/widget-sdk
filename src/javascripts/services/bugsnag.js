'use strict';
/**
 * @ngdoc service
 * @name bugsnag
 * @description
 * Bugsnag wrapper.
 * See https://bugsnag.com/docs/notifiers/js for more details
*/
angular.module('contentful')
.factory('bugsnag', ['$injector', function($injector){
  var $window = $injector.get('$window');
  var CallBuffer = $injector.get('CallBuffer');
  var environment = $injector.get('environment');

  var apiKey = 'b253f10d5d0184a99e1773cec7b726e8';
  var SCRIPT_SRC = '//d2wy8f7a9ursnm.cloudfront.net/bugsnag-2.min.js';

  var loaderPromise;
  var bugsnag;
  var callBuffer = new CallBuffer();

  return {
    /**
     * @ngdoc method
     * @name bugsnag#enable
     * @description
     * Loads bugsnag and sets the user information. Resolves the promise when
     * bugsnag has loaded.
     *
     * It will not reload bugsnag and set the user data if called multiple
     * times.
     *
     * @param {API.User} user
     * @returns {Promise<void>}
     */
    enable: function (user) {
      if (!loaderPromise) {
        var angularLoad = $injector.get('angularLoad');
        var environment = $injector.get('environment');
        loaderPromise = angularLoad.loadScript(SCRIPT_SRC)
        .then(function () {
          bugsnag = $window.Bugsnag;//.noConflict();
          bugsnag.apiKey              = apiKey;
          bugsnag.notifyReleaseStages = ['staging', 'production'];
          bugsnag.releaseStage        = environment.env;
          bugsnag.appVersion          = environment.gitRevision;
          setUserInfo(user, bugsnag);
          callBuffer.resolve();
        }, function () {
          callBuffer.disable();
        });
      }
      return loaderPromise;
    },

    disable: function(){
      var $q = $injector.get('$q');
      loaderPromise = $q.reject();
      callBuffer.disable();
    },

    notify: function(){
      var args = arguments;
      callBuffer.call(function(){
        if (bugsnag) bugsnag.notify.apply(bugsnag, args);
      });
    },
    notifyException: function(){
      var args = arguments;
      callBuffer.call(function(){
        if (bugsnag) bugsnag.notifyException.apply(bugsnag, args);
      });
    },
    refresh: function(){
      if (bugsnag) bugsnag.refresh();
    },
  };

  function setUserInfo (user, bugsnag) {
    if (dotty.exists(user, 'sys.id')) {
      bugsnag.user = {
        id: dotty.get(user, 'sys.id'),
        firstName: dotty.get(user, 'firstName'),
        lastName: dotty.get(user, 'lastName'),
        adminLink: getAdminLink(user),
        organizations: getOrganizations(user),
      };
    }
  }

  function getOrganizations (user) {
    var organizationNames = _.map(user.organizationMemberships, function(m){
      return m.organization.name;
    });
    return organizationNames.join(', ');
  }

  function getAdminLink(user) {
    var id = dotty.get(user, 'sys.id');
    return 'https://admin.' + environment.settings.main_domain + '/admin/users/' + id;
  }
}]);

