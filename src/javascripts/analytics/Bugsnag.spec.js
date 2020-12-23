import * as LazyLoader from 'utils/LazyLoader';

const mockBugsnag = {
  disableAutoBreadcrumbsConsole: jest.fn(),
  enableNotifyUnhandledRejections: jest.fn(),
  notify: jest.fn(),
  notifyException: jest.fn(),
  refresh: jest.fn(),
};

jest.mock('utils/LazyLoader', () => ({
  get: jest.fn().mockImplementation(() => Promise.resolve(mockBugsnag)),
}));

describe('bugsnag', () => {
  beforeEach(() => {
    jest.resetModules();
  });

  it('delegates #notify', async function () {
    const bugsnag = require('./Bugsnag');
    await bugsnag.enable();
    bugsnag.notify('ERROR');
    expect(mockBugsnag.notify).toHaveBeenCalledWith('ERROR');
  });

  it('delegates #notify after bugsnag has loaded', async function () {
    const bugsnag = require('./Bugsnag');
    bugsnag.notify('ERROR');
    expect(mockBugsnag.notify).not.toHaveBeenCalled();
    await bugsnag.enable();
    expect(mockBugsnag.notify).toHaveBeenCalledWith('ERROR');
  });

  describe('user information', () => {
    it('is added for user without organizations', async function () {
      const bugsnag = require('./Bugsnag');
      await bugsnag.enable({
        sys: { id: 'USER_ID' },
      });
      expect(mockBugsnag.user.id).toEqual('USER_ID');
      expect(mockBugsnag.user.organizations).toEqual('');
    });
    it('is added for user with organizations', async function () {
      const bugsnag = require('./Bugsnag');
      await bugsnag.enable({
        sys: { id: 'UID' },
        organizationMemberships: [
          { organization: { sys: { id: 'foo' } } },
          { organization: { sys: { id: 'bar' } } },
        ],
      });
      expect(mockBugsnag.user.id).toEqual('UID');
      expect(mockBugsnag.user.organizations).toEqual('foo, bar');
    });
  });

  it('enabling after disabling does not send notifications', async function () {
    const bugsnag = require('./Bugsnag');
    await bugsnag.enable();
    await bugsnag.disable();
    bugsnag.notify('ERROR');
    expect(mockBugsnag.notify).not.toHaveBeenCalled();
  });

  describe('when script loading fails', () => {
    beforeEach(function () {
      LazyLoader.get.mockRejectedValue();
    });

    it('#notify() does not throw', async function () {
      const bugsnag = require('./Bugsnag');
      await bugsnag.enable();

      bugsnag.notify();
    });
  });
});
