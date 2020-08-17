import { resendActivationEmail } from './activationEmailResender';
import * as loggerMocked from 'services/logger';

global.fetch = jest.fn();

describe('activationEmailResender', () => {
  beforeEach(() => {
    global.fetch.mockResolvedValue({
      json: jest.fn(),
      ok: true,
    });
  });

  afterEach(() => {
    global.fetch.mockReset();
  });

  afterAll(() => {
    global.fetch.mockClear();
    delete global.fetch;
  });

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

      expect(global.fetch).toBeCalledWith('https://be.contentful.com/confirmation', {
        body: 'user%5Bemail%5D=user%40example.com',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        method: 'POST',
      });
    });
  });

  describe('error logging on rejection via `logger.logError()`', () => {
    it('includes the right message and data', async function () {
      global.fetch.mockResolvedValue({
        ok: false,
        status: 418,
        body: jest.fn(),
        statusText: "I'm a teapot",
        json: jest.fn(async () => 'tea'),
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
