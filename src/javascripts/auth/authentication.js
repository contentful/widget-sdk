'use strict';

/**
 * @ngdoc service
 * @name authentication
 *
 * @description
 * This service is responsible for authentication for the web application, and
 * contains methods responsible for login, logout and fetching updated access tokens.
 *
 */

angular.module('contentful')
.factory('authentication', ['require', function (require) {
  var environment = require('environment');
  var $location = require('$location');
  var $window = require('$window');
  var $http = require('$http');
  var $q = require('$q');
  var notification = require('notification');
  var authToken = require('authentication/token');
  var TheStore = require('TheStore');
  var $state = require('$state');
  var transition = require('navigation/transition');

  var authApp = '//' + environment.settings.authUrl + '/';
  var marketingApp = environment.settings.marketingUrl + '/';

  var CLIENT_ID = environment.settings.contentful.webappClientId;
  var REDIRECT_URI = $window.location.protocol + '//' + $window.location.host + '/';
  var TOKEN_SCOPE = 'content_management_manage';

  var isAuthenticating = false;

  return {
    login: login,
    loginAfresh: loginAfresh,
    logout: logout,
    logoutCancelledUser: logoutCancelledUser,
    getToken: function () { return authToken.get(); },
    token$: authToken.token$,
    /**
     * @ngdoc method
     * @name authentication#isAuthenticating
     * @returns {Boolean}
     * @description
     * Returns `true` if login flow is in progress, otherwise false.
     */
    isAuthenticating: function () {
      return isAuthenticating;
    },
    /**
     * @ngdoc method
     * @name authentication#accountUrl
     * @returns {String}
     * @description
     * Returns the URL of the user's account page.
     */
    accountUrl: function () {
      return authApp + 'account';
    },
    /**
     * @ngdoc method
     * @name authentication#supportUrl
     * @returns {String}
     * @description
     * Returns the URL of the support page.
     */
    supportUrl: function () {
      return authApp + 'integrations/zendesk/login';
    },
    /**
     * @ngdoc method
     * @name authentication#spaceSettingsUrl
     * @returns {String}
     * @description
     * Returns the current space URL
     */
    spaceSettingsUrl: function (spaceId) {
      return authApp + 'settings/spaces/' + spaceId;
    }
  };

  /**
   * @ngdoc method
   * @name authentication#login
   * @returns {Promise<object>}
   * @description
   * Returns a promise. Redirects to Gatekeeper login page if required.
   */
  function login () {
    var token = authToken.get();

    return $q.resolve().then(function () {
      if (token) {
        // param set in gatekeeper application_controller#after_sign_in_path_for
        if ($location.search().already_authenticated) {
          notification.info('You are already signed in.');
        }
        return { token: token };
      } else {
        return authenticate();
      }
    }).then(function (result) {
      if (!result.redirect) {
        redirectAfterLogin();
      }
      return result;
    });
  }

  function authenticate () {
    isAuthenticating = true;

    return fetchNewToken()
      .then(function (token) {
        authToken.set(token);
        isAuthenticating = false;
        return { token: token };
      })
      .catch(redirectToLogin);
  }

  /**
   * @ngdoc method
   * @name authentication#loginAfresh
   * @returns {Promise<object>|void}
   * @description
   * Clears the auth token from browser storage and calls #login().
   */
  function loginAfresh () {
    authToken.clear();
    return login();
  }

  /**
   * @ngdoc method
   * @name authentication#logout
   * @description
   * Revoke auth token and redirect to logout page.
   */
  function logout () {
    var token = authToken.get();
    var payload = $.param({token: token});
    return $http.post(authApp + 'oauth/revoke', payload, {
      headers: {
        'Authorization': 'Bearer ' + token,
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    }).finally(function () {
      authToken.clear();
      return redirect(authApp + 'logout');
    });
  }

  /**
   * @ngdoc method
   * @name authentication#logoutCancelledUser
   * @description
   * Clear auth token from browser storage and redirect to the `sorry to see you
   * go` page.
   */
  function logoutCancelledUser () {
    authToken.clear();
    return redirect(marketingApp + 'goodbye');
  }

  function redirectToLogin () {
    var currentTransition = transition.get();
    var redirectPath = '';

    if (currentTransition) {
      redirectPath = $state.href(currentTransition.toState, currentTransition.toParams);
    } else if (/^\/(\w+)/.test($location.path())) {
      redirectPath = $location.path();
    }

    TheStore.set('redirect_after_login', redirectPath);

    return redirect(authApp + 'login');
  }

  function redirectAfterLogin () {
    var afterLoginPath = TheStore.get('redirect_after_login');

    if (afterLoginPath) {
      TheStore.remove('redirect_after_login');
      $location.path(afterLoginPath);
    }
  }

  function redirect (url) {
    $window.location = url;
    return $q.resolve({ redirect: url });
  }

  function fetchNewToken () {
    var params = $.param({
      grant_type: 'password',
      client_id: CLIENT_ID,
      redirect_uri: REDIRECT_URI,
      scope: TOKEN_SCOPE
    });

    return $http.post(authApp + 'oauth/token', params, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      withCredentials: true
    }).then(function (response) {
      var token = _.get(response, 'data.access_token');
      return token ? $q.resolve(token) : $q.reject();
    });
  }
}]);
