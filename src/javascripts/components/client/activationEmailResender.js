import _ from 'lodash';
import { captureError } from 'core/monitoring';

import postForm from 'data/Request/PostForm';
import * as Config from 'Config';

const ENDPOINT = Config.authUrl('confirmation');

/**
 * Makes Gatekeeper resend the activation email already sent to the user with
 * the given email. The request will be ignored if the user is confirmed already
 * or if the given email address is not associated with any user.
 */
export async function resendActivationEmail(email) {
  if (!_.isString(email)) {
    throw new Error('email is required and expected to be a string');
  }
  const data = { user: { email } };

  try {
    await postForm(ENDPOINT, data);
  } catch (error) {
    const errorJson = await error.json();

    captureError(new Error('Failed activation email resend attempt'), {
      email: email,
      response: {
        status: error.status,
        statusText: error.statusText,
        data: errorJson,
      },
    });

    throw new Error('The email could not be sent');
  }
}
