'use strict';

angular.module('contentful')
/**
 * @ngdoc service
 * @name activationEmailResender
 * @description
 * Allows to resend the activation email sent to each new user.
 */
.factory('activationEmailResender', ['$injector', function ($injector) {

  var Config = $injector.get('Config');
  var $http = $injector.get('$http');
  var $q = $injector.get('$q');
  var uriEncode = $injector.get('$window').encodeURIComponent;
  var logger = $injector.get('logger');

  var ENDPOINT = Config.authUrl('confirmation');

  return {
    /**
     * @ngdoc method
     * @name activationEmailResender#resend
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
      throw new Error('email is required and expected to be a string');
    }
    var data = uriEncode('user[email]') + '=' + uriEncode(email);
    var request = {
      method: 'POST',
      url: ENDPOINT,
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      data: data
    };

    return $http(request).then(_.noop, function (response) {
      logger.logError('Failed activation email resend attempt', {
        data: {
          email: email,
          request: _.extend({}, request, {headers: response.config.headers}),
          response: _.pick(response, ['status', 'statusText', 'data'])
        }
      });
      return $q.reject(new Error('The email could not be sent'));
    });
  }
}]);
