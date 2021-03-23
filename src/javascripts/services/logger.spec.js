import _ from 'lodash';
import * as logger from './logger';
import * as Sentry from 'analytics/Sentry';

jest.mock('analytics/Sentry');

jest.mock('states/Navigator', () => ({
  getCurrentStateName: jest.fn().mockReturnValue('route'),
}));

describe('logger service', () => {
  it('enables', function () {
    logger.enable('USER');
    expect(Sentry.enable).toHaveBeenCalledWith('USER');
  });

  it('logs exceptions', function () {
    const exception = new Error();
    logger.logException(exception, { meta: 'Data' });

    expect(Sentry.logException).toHaveBeenCalledWith(exception, { meta: 'Data' });
  });

  it('logs errors', function () {
    logger.logError('test', { meta: 'Data' });

    expect(Sentry.logMessage).toHaveBeenCalledWith('test', {
      level: 'error',
      tags: {
        route: expect.any(String),
      },
      extra: {
        type: 'Logged Error',
        meta: 'Data',
      },
    });
  });

  it('does not log errors with empty messages', function () {
    logger.logError();

    expect(Sentry.logMessage).not.toHaveBeenCalled();

    logger.logError(null, { meta: 'Something' });

    expect(Sentry.logMessage).not.toHaveBeenCalled();

    logger.logError('', { meta: 'Something else' });

    expect(Sentry.logMessage).not.toHaveBeenCalled();
  });

  it('handles messages that are of type Error as well as String', function () {
    const err = new Error('Oops something went wrong');
    const errMsg = 'Wowzers this is messed up';

    logger.logError(errMsg);

    expect(Sentry.logMessage).toHaveBeenCalledWith(errMsg, {
      level: 'error',
      tags: {
        route: expect.any(String),
      },
      extra: {
        type: 'Logged Error',
      },
    });

    logger.logError(err);

    expect(Sentry.logMessage).toHaveBeenCalledWith(err.message, {
      level: 'error',
      tags: {
        route: expect.any(String),
      },
      extra: {
        type: 'Logged Error',
      },
    });
  });

  it('logs warnings', function () {
    logger.logWarn('test', { meta: 'Data' });

    expect(Sentry.logMessage).toHaveBeenCalledWith('test', {
      level: 'warning',
      tags: {
        route: expect.any(String),
      },
      extra: {
        type: 'Logged Warning',
        meta: 'Data',
      },
    });
  });

  it('logs sharejs errors', function () {
    logger.logSharejsError('test', { meta: 'Data' });
    expect(Sentry.logMessage).toHaveBeenCalledWith('test', {
      level: 'error',
      tags: {
        route: expect.any(String),
      },
      extra: {
        type: 'Logged ShareJS Error',
        meta: 'Data',
      },
    });
  });

  it('logs sharejs warnings', function () {
    logger.logSharejsWarn('test', { meta: 'Data' });
    expect(Sentry.logMessage).toHaveBeenCalledWith('test', {
      level: 'warning',
      tags: {
        route: expect.any(String),
      },
      extra: {
        type: 'Logged ShareJS Warning',
        meta: 'Data',
      },
    });
  });

  describe('when receiving error with status code 0', () => {
    it('logs errors as cors warnings', function () {
      logger.logServerError('test', { meta: 'Data', error: { statusCode: 0 } });

      expect(Sentry.logMessage).toHaveBeenCalledWith('test', {
        level: 'warning',
        tags: {
          route: expect.any(String),
        },
        extra: {
          type: 'CORS Warning',
          meta: 'Data',
          error: {
            statusCode: 0,
          },
        },
      });
    });
    it('logs warnings as cors warnings', function () {
      logger.logServerWarn('test', { meta: 'Data', error: { statusCode: 0 } });

      expect(Sentry.logMessage).toHaveBeenCalledWith('test', {
        level: 'warning',
        tags: {
          route: expect.any(String),
        },
        extra: {
          type: 'CORS Warning',
          meta: 'Data',
          error: {
            statusCode: 0,
          },
        },
      });
    });
  });
});
