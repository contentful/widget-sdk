'use strict';
/**
 * @ngdoc service
 * @name bugsnag
 * @description
 * Bugsnag wrapper.
 * See https://bugsnag.com/docs/notifiers/js for more details
*/
angular.module('contentful')
.factory('bugsnag', ['$injector', function ($injector) {
  var CallBuffer = $injector.get('utils/CallBuffer');
  var environment = $injector.get('environment');

  // TODO this should be stored in the environment configuration. Need
  // to work with devops get this done.
  var API_KEY = 'b253f10d5d0184a99e1773cec7b726e8';

  var bugsnag;
  var callBuffer = CallBuffer.create();
  var loadOnce = _.once(load);

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
      return loadOnce(user);
    },

    disable: function () {
      callBuffer.disable();
    },

    notify: function () {
      var args = arguments;
      callBuffer.call(function () {
        if (bugsnag) bugsnag.notify.apply(bugsnag, args);
      });
    },

    notifyException: function () {
      var args = arguments;
      callBuffer.call(function () {
        if (bugsnag) bugsnag.notifyException.apply(bugsnag, args);
      });
    },

    refresh: function () {
      if (bugsnag) bugsnag.refresh();
    },

    /**
     * @ngdoc method
     * @name bugsnag#leaveBreadcrumb
     * @description
     * Records an event.
     *
     * The event trail is shown on bugsnag when an error occured.
     *
     * Note that the data object should only be one level deep and the
     * object’s values are limited to 140 characters each.
     *
     * https://docs.bugsnag.com/platforms/browsers/#leaving-breadcrumbs
     *
     * @param {string} name
     * @param {object} data
     */
    leaveBreadcrumb: function (name, data) {
      callBuffer.call(function () {
        if (bugsnag) bugsnag.leaveBreadcrumb(name, data);
      });
    }
  };

  function load (user) {
    // Prevent circular dependency
    var LazyLoader = $injector.get('LazyLoader');
    return LazyLoader.get('bugsnag')
    .then(function (_bugsnag) {
      bugsnag = _bugsnag;
      bugsnag.apiKey = API_KEY;
      bugsnag.notifyReleaseStages = ['staging', 'production'];
      bugsnag.releaseStage = environment.env;
      bugsnag.appVersion = environment.gitRevision;
      setUserInfo(user, bugsnag);
      callBuffer.resolve();
    }, function () {
      callBuffer.disable();
    });
  }

  function setUserInfo (user, bugsnag) {
    if (dotty.exists(user, 'sys.id')) {
      bugsnag.user = {
        id: dotty.get(user, 'sys.id'),
        firstName: dotty.get(user, 'firstName'),
        lastName: dotty.get(user, 'lastName'),
        adminLink: getAdminLink(user),
        organizations: getOrganizations(user)
      };
    }
  }

  function getOrganizations (user) {
    var organizationNames = _.map(user.organizationMemberships, function (m) {
      return m.organization.name;
    });
    return organizationNames.join(', ');
  }

  function getAdminLink (user) {
    var id = dotty.get(user, 'sys.id');
    return 'https://admin.' + environment.settings.main_domain + '/admin/users/' + id;
  }
}]);
