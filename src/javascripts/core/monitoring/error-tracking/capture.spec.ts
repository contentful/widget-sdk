import { captureWarning, captureError } from './capture';
import { withScope, captureException } from '@contentful/experience-error-tracking';
import { getCurrentStateName } from 'states/Navigator';

jest.mock('@contentful/experience-error-tracking');
jest.mock('states/Navigator');

const withScopeMocked = withScope as jest.Mock<typeof withScope>;
// @ts-expect-error complaining due to jsdoc
const getCurrentStateNameMocked = getCurrentStateName as jest.Mock<typeof getCurrentStateName>;

describe('capture errors', () => {
  let scope;

  beforeEach(() => {
    scope = {
      setLevel: jest.fn(),
      setTags: jest.fn(),
      setExtras: jest.fn(),
    };
    withScopeMocked.mockImplementation((cb) => cb(scope));
  });

  it(`passes error and context along`, () => {
    const error = new Error('something bad');
    const context = {};

    captureError(error, context);
    expect(captureException).toBeCalledWith(error, context);
  });

  it('should send Sentry an error-level error when calling captureError', () => {
    const error = new Error('something bad');

    captureError(error);

    expect(scope.setLevel).toBeCalledWith('error');
    expect(captureException).toBeCalledWith(error, undefined);
  });

  it('should send Sentry a warning-level error when calling captureWarning', () => {
    const error = new Error('something kind of bad');

    captureWarning(error);

    expect(scope.setLevel).toBeCalledWith('warning');
    expect(captureException).toBeCalledWith(error, undefined);
  });

  it(`adds route name as tag`, () => {
    // @ts-expect-error complaining due to jsdoc
    getCurrentStateNameMocked.mockReturnValue('test-route');
    captureError(new Error());

    expect(scope.setTags).toBeCalledWith({ route: 'test-route' });
  });

  it(`adds error properties as extras`, () => {
    const extras = {
      customKey1: 'value1',
      customKey2: 'value2',
    };
    const error = Object.assign(new Error('something happened'), extras);

    captureError(error);

    expect(scope.setExtras).toBeCalledWith(error);
  });
});
