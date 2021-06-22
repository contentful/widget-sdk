import * as LazyLoader from 'utils/LazyLoader';
import * as service from './OsanoService';
import isAnalyticsAllowed from 'analytics/isAnalyticsAllowed';
import * as Analytics from 'analytics/Analytics';
import * as Segment from 'analytics/segment';
import { getBrowserStorage } from 'core/services/BrowserStorage';
import { Notification } from '@contentful/forma-36-react-components';
import { updateUserData } from 'features/user-profile';
import { getUserSync } from 'services/TokenStore';

jest.mock('utils/LazyLoader', () => {
  return {
    get: jest.fn(),
  };
});

jest.mock('core/services/BrowserStorage', () => {
  const store = {
    get: jest.fn(),
    set: jest.fn(),
    has: jest.fn(),
  };

  return {
    getBrowserStorage: jest.fn().mockReturnValue(store),
  };
});

jest.mock('services/TokenStore', () => ({
  getUserSync: jest.fn(),
}));

jest.mock('analytics/isAnalyticsAllowed', () => jest.fn().mockReturnValue(true));
jest.mock('features/user-profile', () => ({
  updateUserData: jest.fn().mockResolvedValue(true),
}));

jest.mock('analytics/segment', () => ({
  enable: jest.fn(),
  getIntegrations: jest.fn().mockResolvedValue([]),
}));

describe('OsanoService', () => {
  let user;

  beforeEach(service.__reset);
  beforeEach(() => {
    jest.spyOn(Notification, 'warning').mockImplementation(() => {});

    const client = {
      _onCbs: {},
      cm: {
        on: jest.fn((event, cb) => {
          client._onCbs[event] = cb;
        }),
        getConsent: jest.fn().mockReturnValue(generateConsentOptions()),
        showDrawer: jest.fn(),
      },
    };

    LazyLoader.get.mockResolvedValue(client);

    user = {
      cookieConsentData: JSON.stringify({
        userInterface: {
          rawConsentRecord: 'abcd',
          consentRecord: generateConsentOptions(),
          uuid: 'consent_record_uuid',
          expirationDate: 987654321,
        },
      }),
      sys: { version: 123 },
    };

    getUserSync.mockReturnValue(user);
  });

  afterEach(() => {
    const store = getBrowserStorage();

    store.get.mockReset();
    store.set.mockReset();
    store.has.mockReset();

    Notification.warning.mockRestore();
  });

  const callHandleInitialize = () => {
    return service.handleInitialize();
  };

  const callHandleConsentSaved = async () => {
    const promise = service.handleConsentSaved();

    service.handleConsentSaved.flush();

    await new Promise((resolve) => process.nextTick(resolve));

    return promise;
  };

  const setupService = async (opts = generateConsentOptions()) => {
    const { cm } = await LazyLoader.get();
    cm.getConsent.mockReturnValue(opts);
    await service.init();
    return cm;
  };

  describe('handleInitialize', () => {
    it('should hide the marketing toggles', async () => {
      jest.spyOn(document, 'querySelectorAll');

      await setupService();
      await callHandleInitialize();

      expect(document.querySelectorAll).toHaveBeenCalledTimes(1);
      expect(document.querySelectorAll).toHaveBeenCalledWith("[data-category='MARKETING']");

      document.querySelectorAll.mockRestore();
    });

    it('should enable analytics with all Segment integrations if analytics and personalization is allowed', async () => {
      await setupService();
      await callHandleInitialize();

      expect(Analytics.enable).toHaveBeenCalledWith(expect.any(Object), {
        integrations: {
          all: false,
          FullStory: true,
          'Segment.io': true,
          'Google Analytics': true,
          'Amazon Kinesis Firehose': true,
          'Amazon S3': true,
          'LaunchDarkly Events': true,
          Intercom: true,
          Wootric: true,
        },
      });
    });

    it('should not attempt to enable analytics twice', async () => {
      await setupService();
      await callHandleInitialize();
      await callHandleInitialize();

      expect(Analytics.enable).toHaveBeenCalledTimes(1);
    });

    it('should disable any additional integrations from Segment', async () => {
      Segment.getIntegrations.mockResolvedValueOnce(['My Awesome Integration']);
      await setupService();

      await callHandleInitialize();

      expect(Analytics.enable).toHaveBeenCalledWith(expect.any(Object), {
        integrations: {
          all: false,
          'My Awesome Integration': false,
          FullStory: true,
          'Segment.io': true,
          'Google Analytics': true,
          'Amazon Kinesis Firehose': true,
          'Amazon S3': true,
          'LaunchDarkly Events': true,
          Intercom: true,
          Wootric: true,
        },
      });
    });

    it('should enable analytics with only analytics Segment integrations if analytics but not personalization is allowed', async () => {
      await setupService(generateConsentOptions(true, false));

      await callHandleInitialize();

      expect(Analytics.enable).toHaveBeenCalledWith(expect.any(Object), {
        integrations: {
          all: false,
          FullStory: true,
          'Segment.io': true,
          'Google Analytics': true,
          'Amazon Kinesis Firehose': true,
          'Amazon S3': true,
          'LaunchDarkly Events': true,
          Intercom: false,
          Wootric: false,
        },
      });
    });

    it('should respect isAnalyticsAllowed', async () => {
      await setupService(generateConsentOptions(true, false));

      isAnalyticsAllowed.mockReturnValue(false);

      await callHandleInitialize();

      expect(Analytics.enable).not.toHaveBeenCalled();
    });

    it('should only enable Intercom and Wootric (via Segment) if analytics is denied but personalization is allowed', async () => {
      await setupService(generateConsentOptions(false, true));

      await callHandleInitialize();

      expect(Analytics.enable).not.toHaveBeenCalled();

      expect(Segment.enable).toHaveBeenCalledWith({
        integrations: {
          all: false,
          FullStory: false,
          'Segment.io': false,
          'Google Analytics': false,
          'Amazon Kinesis Firehose': false,
          'Amazon S3': false,
          'LaunchDarkly Events': false,
          Intercom: true,
          Wootric: true,
        },
      });
    });

    it('should not enable analytics is neither is allowed', async () => {
      await setupService(generateConsentOptions(false, false));

      await callHandleInitialize();

      expect(Analytics.enable).not.toHaveBeenCalled();
      expect(Segment.enable).not.toHaveBeenCalled();
    });
  });

  describe('handleConsentChanged', () => {
    it('should warn the user to reload if they change their consent options and the service is initialized', async () => {
      const cm = await setupService();

      await callHandleInitialize();

      await callHandleConsentSaved();
      await callHandleConsentSaved();

      expect(Notification.warning).not.toBeCalled();
      expect(updateUserData).not.toBeCalled();

      const newOpts = generateConsentOptions(false, false);
      cm.getConsent.mockReturnValue(newOpts);

      await callHandleConsentSaved();

      expect(updateUserData).toHaveBeenCalledTimes(1);
      expect(Notification.warning).toHaveBeenCalledTimes(1);
    });

    it(`should not attempt to update the user's consent record if the consent hasn't changed`, async () => {
      await setupService();
      await callHandleConsentSaved();

      expect(updateUserData).not.toBeCalled();
    });

    it('should not warn the user if their consent record was migrated', async () => {
      user.cookieConsentData = JSON.stringify({
        consent: generateConsentOptions(false, false),
        expirationDate: 1234,
        uuid: 'some-uuid',
      });

      await setupService();
      await callHandleConsentSaved();

      expect(updateUserData).toBeCalled();
      expect(Notification.warning).not.toBeCalled();
    });

    it('should not warn the user if this is their first consent record', async () => {
      user.cookieConsentData = null;

      await setupService();
      await callHandleConsentSaved();

      expect(updateUserData).toBeCalled();
      expect(Notification.warning).not.toBeCalled();
    });
  });

  describe('init', () => {
    it('should get Osano from LazyLoader', async () => {
      await service.init();

      expect(LazyLoader.get).toHaveBeenCalled();
    });

    it('should return false if LazyLoader.get throws', async () => {
      LazyLoader.get.mockRejectedValueOnce();

      expect(await service.init()).toBe(false);
    });

    it('should return false if LazyLoader returns nothing', async () => {
      LazyLoader.get.mockResolvedValueOnce(null);

      expect(await service.init()).toBe(false);
    });

    it('should add persisted consent to localStorage', async () => {
      const store = getBrowserStorage();

      await service.init();

      expect(store.set).toHaveBeenCalledWith('osano_consentmanager', expect.any(String));
      expect(store.set).toHaveBeenCalledWith('osano_consentmanager_expdate', expect.any(Number));
      expect(store.set).toHaveBeenCalledWith('osano_consentmanager_uuid', expect.any(String));
    });

    it('should add legacy consent to localStorage', async () => {
      const store = getBrowserStorage();

      user.cookieConsentData = JSON.stringify({
        consent: 'consent-1234',
        expirationDate: 1234,
        uuid: 'uuid-1234',
      });

      await service.init();

      expect(store.set).toHaveBeenCalledWith('osano_consentmanager', 'consent-1234');
      expect(store.set).toHaveBeenCalledWith('osano_consentmanager_expdate', 1234);
      expect(store.set).toHaveBeenCalledWith('osano_consentmanager_uuid', 'uuid-1234');
    });

    it('should only call the LazyLoader once, even after multiple init calls', async () => {
      await service.init();
      await service.init();
      await service.init();

      expect(LazyLoader.get).toHaveBeenCalledTimes(1);
    });

    it('should not fetch Osano if __disable_consentmanager is in localStorage', async () => {
      const store = getBrowserStorage();
      store.has.mockReturnValueOnce(true);

      await service.init();

      // We should not fetch the Osano script if the flag exists
      expect(LazyLoader.get).toHaveBeenCalledTimes(0);
    });

    it('should setup listeners for various events', async () => {
      const { cm } = await LazyLoader.get();

      await service.init();

      expect(cm.on).toHaveBeenCalledWith('osano-cm-initialized', expect.any(Function));
      expect(cm.on).toHaveBeenCalledWith('osano-cm-consent-saved', expect.any(Function));
    });
  });

  describe('waitForCMInstance', () => {
    beforeEach(() => {
      // `waitForCMInstance` internally sets a 100ms timeout, and we want to explicitly
      // test `setTimeout` calls, so we mock `setTimeout`.
      //
      // This is mocked, rather than setting fake timers, since we don't care about exact
      // timing and just care that the setTimeout callback is immediately executed.
      jest.spyOn(window, 'setTimeout').mockImplementation((fn) => fn());
    });

    afterEach(() => {
      window.setTimeout.mockRestore();
    });

    it('should retry 10 times and then throw if cm is not available', async () => {
      await expect(service.waitForCMInstance()).rejects.toThrow();
      expect(window.setTimeout).toHaveBeenCalledTimes(10);
    });

    it('should resolve if cm is available', async () => {
      await service.init();

      await expect(service.waitForCMInstance()).resolves.toBeUndefined();
    });
  });

  describe('openConsentManagementPanel', () => {
    it('should call cm.showDrawer', async () => {
      const { cm } = await LazyLoader.get();

      await service.init();

      service.openConsentManagementPanel();

      expect(cm.showDrawer).toBeCalled();
    });
  });

  it('should hide the marketing toggles', async () => {
    jest.spyOn(document, 'querySelectorAll');

    await service.init();

    service.openConsentManagementPanel();
    expect(document.querySelectorAll).toHaveBeenCalledWith("[data-category='MARKETING']");

    document.querySelectorAll.mockRestore();
  });
});

function generateConsentOptions(analyticsAllowed = true, personalizationAllowed = true) {
  return {
    ANALYTICS: analyticsAllowed ? 'ACCEPT' : 'DENY',
    PERSONALIZATION: personalizationAllowed ? 'ACCEPT' : 'DENY',
    MARKETING: 'DENY',
    ESSENTIAL: 'ACCEPT',
  };
}
