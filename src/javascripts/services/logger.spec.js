import * as logger from './logger';
// eslint-disable-next-line no-restricted-imports
import { withScope, captureException } from '@contentful/experience-error-tracking';
import { getCurrentStateName } from 'states/Navigator';

jest.mock('@contentful/experience-error-tracking');

jest.mock('states/Navigator');

describe('logger service', () => {
  let scope;

  beforeEach(() => {
    scope = {
      setLevel: jest.fn(),
      setTags: jest.fn(),
      setExtras: jest.fn(),
    };
    withScope.mockImplementation((cb) => cb(scope));
  });

  it(`passes error and context along`, () => {
    const error = new Error('something bad');
    const context = {};

    logger.captureError(error, context);
    expect(captureException).toBeCalledWith(error, context);
  });

  it('should send Sentry an error-level error when calling captureError', () => {
    const error = new Error('something bad');

    logger.captureError(error);

    expect(scope.setLevel).toBeCalledWith('error');
    expect(captureException).toBeCalledWith(error, undefined);
  });

  it('should send Sentry a warning-level error when calling captureWarning', () => {
    const error = new Error('something kind of bad');

    logger.captureWarning(error);

    expect(scope.setLevel).toBeCalledWith('warning');
    expect(captureException).toBeCalledWith(error, undefined);
  });

  it(`adds route name as tag`, () => {
    getCurrentStateName.mockReturnValue('test-route');
    logger.captureError(new Error());

    expect(scope.setTags).toBeCalledWith({ route: 'test-route' });
  });

  it(`adds error properties as extras`, () => {
    const extras = {
      customKey1: 'value1',
      customKey2: 'value2',
    };
    const error = Object.assign(new Error('something happened'), extras);

    logger.captureError(error);

    expect(scope.setExtras).toBeCalledWith(error);
  });
});
