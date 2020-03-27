import { resendActivationEmail } from './activationEmailResender';
import $httpMocked from 'ng/$http';
import * as loggerMocked from 'services/logger';

describe('activationEmailResender', () => {
  describe('.resend() without email', () => {
    it('throws an error since no email is given', async () => {
      let message = '';
      try {
        await resendActivationEmail();
      } catch (e) {
        message = e.message;
      }
      expect(message).toEqual('email is required and expected to be a string');
    });
  });

  describe('resend(email)', () => {
    it('sends data as expected by Gatekeeper', async () => {
      await resendActivationEmail('user@example.com');

      expect($httpMocked).toBeCalledWith({
        data: 'user%5Bemail%5D=user%40example.com',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        method: 'POST',
        url: 'https://be.contentful.comconfirmation',
      });
    });
  });

  describe('error logging on rejection via `logger.logError()`', () => {
    it('includes the right message and data', async function () {
      $httpMocked.mockRejectedValue({
        status: 418,
        data: 'tea',
        statusText: "I'm a teapot",
      });

      try {
        await resendActivationEmail('user@example.com');
      } catch (e) {
        // do nothing
      }
      expect(loggerMocked.logError).toHaveBeenCalledWith('Failed activation email resend attempt', {
        data: {
          email: 'user@example.com',
          response: {
            status: 418,
            statusText: "I'm a teapot",
            data: 'tea',
          },
        },
      });
    });
  });
});
