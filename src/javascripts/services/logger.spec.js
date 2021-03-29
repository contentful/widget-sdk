import _ from 'lodash';
import * as logger from './logger';
import * as Sentry from 'analytics/Sentry';
import { PreflightRequestError } from 'data/Request';

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
      tags: {
        route: 'route',
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
      tags: {
        route: 'route',
      },
    });
  });

  it('should augment the given metadata with custom keys on the error', () => {
    const error = new Error('something happened');
    Object.assign(error, {
      customKey1: 'value1',
      customKey2: 'value2',
    });

    logger.captureError(error, {
      meta: 'data',
    });

    expect(Sentry.logException).toHaveBeenNthCalledWith(1, error, {
      level: 'error',
      extra: {
        meta: 'data',
        customKey1: 'value1',
        customKey2: 'value2',
      },
      tags: {
        route: 'route',
      },
    });

    const warning = new Error('some warning happened');

    Object.assign(warning, {
      customKey1: 'value1',
      customKey2: 'value2',
    });

    logger.captureWarning(warning, {
      other: 'data',
    });

    expect(Sentry.logException).toHaveBeenNthCalledWith(2, warning, {
      level: 'warning',
      extra: {
        other: 'data',
        customKey1: 'value1',
        customKey2: 'value2',
      },
      tags: {
        route: 'route',
      },
    });
  });

  it('should ignore errors that are an instance of PreflightRequestError', () => {
    const error = new PreflightRequestError();

    logger.captureError(error);

    expect(Sentry.logException).not.toBeCalled();
  });
});
