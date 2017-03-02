'use strict';

angular.module('contentful')
/**
 * @ngdoc service
 * @name activationEmailResender
 * @description
 * Allows to resend the activation email sent to each new user.
 */
.factory('activationEmailResender', ['require', function (require) {

  var $q = require('$q');
  var Config = require('Config');
  var logger = require('logger');
  var postForm = require('data/Request/PostForm').default;

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
     * @return {Promise<void>}
     */
    resend: resendActivationEmail
  };

  function resendActivationEmail (email) {
    if (!_.isString(email)) {
      throw new Error('email is required and expected to be a string');
    }
    var data = {user: {email: email}};
    return postForm(ENDPOINT, data)
      .then(
        _.constant(undefined),
        function (response) {
          logger.logError('Failed activation email resend attempt', {
            data: {
              email: email,
              response: _.pick(response, ['status', 'statusText', 'data'])
            }
          });
          return $q.reject(new Error('The email could not be sent'));
        });
  }
}]);
