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

  it('should send Sentry an error-level error when calling captureError', () => {
    const error = new Error('something bad');

    logger.captureError(error, {
      specialMeta: 'yes',
    });

    expect(Sentry.logException).toBeCalledWith(error, {
      level: 'error',
      extra: {
        specialMeta: 'yes',
      },
    });
  });

  it('should send Sentry a warning-level error when calling captureWarning', () => {
    const error = new Error('something kind of bad');

    logger.captureWarning(error, {
      warningMeta: 'data',
    });

    expect(Sentry.logException).toBeCalledWith(error, {
      level: 'warning',
      extra: {
        warningMeta: 'data',
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
