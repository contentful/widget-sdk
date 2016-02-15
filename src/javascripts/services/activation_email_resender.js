'use strict';

angular.module('contentful')
/**
 * @ngdoc service
 * @name activationEmailResender
 * @description
 * Allows to resend the activation email sent to each new user.
 */
.factory('activationEmailResender', ['$injector', function ($injector) {

  var environment = $injector.get('environment');
  var $http       = $injector.get('$http');
  var $q          = $injector.get('$q');
  var uriEncode   = $injector.get('$window').encodeURIComponent;

  var GK_URL = '//' + environment.settings.base_host;
  var ENDPOINT = GK_URL + '/confirmation';

  return {
    /**
     * @ngdoc function
     * @name activationEmailResender#resend
     * @methodOf activationEmailResender
     *
     * @description
     * Makes Gatekeeper resend the activation email already sent to the user with
     * the given email. The request will be ignored if the user is confirmed already
     * or if the given email address is not associated with any user.
     *
     * @param {string} email
     * @return {Promise}
     */
    resend: resendActivationEmail
  };

  function resendActivationEmail (email) {
    if (!_.isString(email)) {
      throw new Error( 'email is required and expected to be a string' );
    }
    var data = uriEncode('user[email]') + '=' + uriEncode(email);

    return $http({
      method: 'POST',
      url: ENDPOINT,
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      data: data
    }).then(_.noop, function () {
      return $q.reject(new Error('The email could not be sent'));
    });
  }
}]);
