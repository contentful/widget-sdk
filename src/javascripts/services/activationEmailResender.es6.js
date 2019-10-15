import { registerFactory } from 'NgRegistry.es6';
import _ from 'lodash';
import * as logger from 'services/logger.es6';

import postForm from 'data/Request/PostForm.es6';
import * as Config from 'Config.es6';

export default function register() {
  /**
   * @ngdoc service
   * @name activationEmailResender
   * @description
   * Allows to resend the activation email sent to each new user.
   */
  registerFactory('activationEmailResender', [
    '$q',
    $q => {
      const ENDPOINT = Config.authUrl('confirmation');

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

      function resendActivationEmail(email) {
        if (!_.isString(email)) {
          throw new Error('email is required and expected to be a string');
        }
        const data = { user: { email: email } };
        return postForm(ENDPOINT, data).then(_.constant(undefined), response => {
          logger.logError('Failed activation email resend attempt', {
            data: {
              email: email,
              response: _.pick(response, ['status', 'statusText', 'data'])
            }
          });
          return $q.reject(new Error('The email could not be sent'));
        });
      }
    }
  ]);
}