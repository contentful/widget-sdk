import { get } from 'utils/LazyLoader';
import * as service from './OsanoService';
import isAnalyticsAllowed from 'analytics/isAnalyticsAllowed';
import * as Analytics from 'analytics/Analytics';
import * as Intercom from 'services/intercom';
import * as Segment from 'analytics/segment';
import { getStore } from 'browserStorage';
import { Notification } from '@contentful/forma-36-react-components';
import { updateUserData } from 'app/UserProfile/Settings/AccountRepository';
import { getUserSync } from 'services/TokenStore';
import { wait } from '@testing-library/react';

jest.mock('utils/LazyLoader', () => {
  const mockedCm = {
    cm: {
      on: jest.fn(),
      emit: jest.fn(),
      setup: jest.fn(),
      whenReady: jest.fn((cb) => cb()),
      whenReadyCb: jest.fn(),
      teardown: jest.fn(),
      storage: {
        key: 'osano_consentmanager',
        setConsent: jest.fn(),
        getConsent: jest.fn(),
        getExpDate: jest.fn().mockReturnValue('test_exp_date'),
        getUUID: jest.fn().mockReturnValue('test_uuid'),
        saveConsent: jest.fn(),
      },
      options: {},
    },
  };

  // I'm sorry for this hacky mess. Future reader, please forgive me.
  //
  // What I'm doing here is ensuring that whenever I get a new instance
  // of this ConsentManager function, I am getting the `mockedCm.cm`
  // object. This makes assertions significantly easier at the expense of
  // not truly testing a separate cm object and new ConsentManager instance.
  //
  // Additionally, because the state is saved during this test run, I reset
  // `mockedCm.cm.storage.key` below in `describe('init') -> afterEach`.
  mockedCm.ConsentManager = function () {
    this.whenReady(this.whenReadyCb);

    return mockedCm.cm;
  };

  Object.entries(mockedCm.cm).forEach(([key, value]) => {
    mockedCm.ConsentManager.prototype[key] = value;
  });

  return {
    get: jest.fn().mockResolvedValue(mockedCm),
  };
});

jest.mock('browserStorage', () => {
  const store = {
    get: jest.fn(),
    set: jest.fn(),
    has: jest.fn(),
  };

  return {
    getStore: jest.fn().mockReturnValue(store),
  };
});

jest.mock('services/TokenStore', () => ({
  getUserSync: jest.fn().mockReturnValue({
    cookieConsentData: JSON.stringify({
      consent: {
        testKey: 'value',
      },
      uuid: 'user_uuid',
      expirationDate: 987654321,
    }),
    sys: { version: 123 },
  }),
}));

jest.mock('analytics/isAnalyticsAllowed', () => jest.fn().mockReturnValue(true));
jest.mock('app/UserProfile/Settings/AccountRepository', () => ({
  updateUserData: jest.fn().mockResolvedValue(true),
}));

jest.mock('services/intercom', () => ({
  enable: jest.fn(),
}));

jest.mock('analytics/segment', () => ({
  enable: jest.fn(),
  getIntegrations: jest.fn().mockResolvedValue([]),
}));

jest.spyOn(Notification, 'warning').mockImplementation(() => {});

describe('OsanoService', () => {
  beforeEach(service.__reset);
  const callHandleInitialize = () => {
    service.handleInitialize();
  };

  const callHandleConsentChanged = () => {
    service.handleConsentChanged();

    service.handleConsentChanged.flush();
  };

  const generateConsentOptions = (analyticsAllowed = true, personalizationAllowed = true) => ({
    ANALYTICS: analyticsAllowed ? 'ACCEPT' : 'DENY',
    PERSONALIZATION: personalizationAllowed ? 'ACCEPT' : 'DENY',
    MARKETING: 'DENY',
    ESSENTIAL: 'ACCEPT',
  });

  const setupService = async (opts = generateConsentOptions()) => {
    const { cm } = await get();
    cm.storage.getConsent.mockReturnValue(opts);
    await service.init();
    return cm;
  };

  describe('handleInitialize', () => {
    it('should enable analytics with all Segment integrations and Intercom if analytics and personalization is allowed', async () => {
      await setupService();

      callHandleInitialize();
      // Need to wait for handleInitialize to finish.
      await wait();

      expect(Analytics.enable).toHaveBeenCalledWith(expect.any(Object), {
        integrations: {
          all: false,
          FullStory: true,
          'Segment.io': true,
          'Google Analytics': true,
          'Amazon Kinesis Firehose': true,
          'Amazon S3': true,
          Intercom: true,
          Wootric: true,
        },
      });

      expect(Intercom.enable).toHaveBeenCalledTimes(1);
    });

    it('should disable any additional integrations from Segment', async () => {
      Segment.getIntegrations.mockResolvedValueOnce(['My Awesome Integration']);
      await setupService();

      callHandleInitialize();
      await wait();

      expect(Analytics.enable).toHaveBeenCalledWith(expect.any(Object), {
        integrations: {
          all: false,
          'My Awesome Integration': false,
          FullStory: true,
          'Segment.io': true,
          'Google Analytics': true,
          'Amazon Kinesis Firehose': true,
          'Amazon S3': true,
          Intercom: true,
          Wootric: true,
        },
      });
    });

    it('should enable analytics with only analytics Segment integrations if analytics but not personalization is allowed', async () => {
      await setupService(generateConsentOptions(true, false));

      callHandleInitialize();
      await wait();

      expect(Analytics.enable).toHaveBeenCalledWith(expect.any(Object), {
        integrations: {
          all: false,
          FullStory: true,
          'Segment.io': true,
          'Google Analytics': true,
          'Amazon Kinesis Firehose': true,
          'Amazon S3': true,
          Intercom: false,
          Wootric: false,
        },
      });

      expect(Intercom.enable).not.toHaveBeenCalled();
    });

    it('should respect isAnalyticsAllowed', async () => {
      await setupService(generateConsentOptions(true, false));

      isAnalyticsAllowed.mockReturnValue(false);

      callHandleInitialize();
      await wait();

      expect(Analytics.enable).not.toHaveBeenCalled();
    });

    it('should only enable Intercom (along with Segment) if analytics is denied but personalization is allowed', async () => {
      await setupService(generateConsentOptions(false, true));

      callHandleInitialize();
      await wait();

      expect(Analytics.enable).not.toHaveBeenCalled();

      expect(Segment.enable).toHaveBeenCalledWith({
        integrations: {
          all: false,
          FullStory: false,
          'Segment.io': false,
          'Google Analytics': false,
          'Amazon Kinesis Firehose': false,
          'Amazon S3': false,
          Intercom: true,
          Wootric: true,
        },
      });
      expect(Intercom.enable).toHaveBeenCalledTimes(1);
    });

    it('should not enable analytics or Intercom is neither is allowed', async () => {
      await setupService(generateConsentOptions(false, false));

      callHandleInitialize();
      await wait();

      expect(Analytics.enable).not.toHaveBeenCalled();
      expect(Segment.enable).not.toHaveBeenCalled();
      expect(Intercom.enable).not.toHaveBeenCalled();
    });

    it('should set local consent from Gatekeeper consent if present', async () => {
      const { cm } = await get();

      await service.init();
      callHandleInitialize();

      expect(cm.storage.setConsent).toBeCalledWith({
        testKey: 'value',
      });
      expect(cm.storage.uuid).toEqual('user_uuid');
      expect(cm.storage.saveConsent).toHaveBeenLastCalledWith(987654321);
    });

    it('should save local consent to Gatekeeper if there is local consent but no Gatekeeper consent', async () => {
      getUserSync.mockReturnValueOnce({ sys: { version: 456 } });
      const { cm } = await get();
      const localConsent = generateConsentOptions();
      cm.storage.getConsent.mockReturnValue(localConsent);

      await service.init();

      callHandleInitialize();
      await wait();

      expect(updateUserData).toHaveBeenCalledWith({
        data: {
          cookieConsentData: JSON.stringify({
            consent: localConsent,
            uuid: 'test_uuid',
            expirationDate: 'test_exp_date',
          }),
        },
        version: 456,
      });
    });

    it('does not save any consent if the user has not consented yet', async () => {
      const { cm } = await get();
      cm.storage.getExpDate.mockReturnValue(0);
      const store = getStore();

      await service.init();

      callHandleInitialize();
      await wait();

      expect(store.set).toHaveBeenCalledTimes(0);
      expect(updateUserData).toHaveBeenCalledTimes(0);
    });
  });

  describe('handleConsentChanged', () => {
    it('should warn the user to reload if they change their consent options', async () => {
      const cm = await setupService();

      callHandleInitialize();
      await wait();

      callHandleInitialize();
      await wait();

      expect(Notification.warning).not.toHaveBeenCalled();

      const newOpts = generateConsentOptions(false, false);
      cm.storage.getConsent.mockReturnValue(newOpts);

      callHandleConsentChanged();
      await wait();

      expect(updateUserData).toHaveBeenCalledTimes(1);
      expect(Notification.warning).toHaveBeenCalledTimes(1);
    });

    it('it should intialize consent if it has not been done yet', async () => {
      const { cm } = await get();
      cm.storage.getExpDate.mockReturnValue(0);
      cm.storage.getConsent.mockReturnValue(generateConsentOptions());
      getUserSync.mockReturnValue({ sys: { version: 123 } });
      isAnalyticsAllowed.mockReturnValue(true);

      await service.init();

      callHandleInitialize();
      await wait();

      expect(Analytics.enable).not.toHaveBeenCalled();
      expect(Intercom.enable).not.toHaveBeenCalled();

      cm.storage.getExpDate.mockReset().mockReturnValue(12);
      callHandleConsentChanged();
      // Ned to wait for HandleConsentChanged to finish.
      await wait();

      expect(Analytics.enable).toHaveBeenCalled();

      expect(Intercom.enable).toHaveBeenCalledTimes(1);
      cm.storage.getExpDate.mockReset().mockReturnValue(0);
    });
  });

  describe('init', () => {
    afterEach(async () => {
      const { cm } = await get();
      cm.storage.key = 'osano_consentmanager';
    });

    it('should get Osano from LazyLoader', async () => {
      await service.init();

      expect(get).toHaveBeenCalled();
    });

    it('should only call the LazyLoader once, even after multiple init calls', async () => {
      await service.init();
      await service.init();
      await service.init();

      expect(get).toHaveBeenCalledTimes(1);
    });

    it('should immediately teardown the original instance', async () => {
      const { cm } = await get();

      await service.init();

      expect(cm.teardown).toHaveBeenCalledTimes(1);
    });

    it('should set the updated cookie value', async () => {
      const { cm } = await get();

      expect(cm.storage.key).toBe('osano_consentmanager');

      await service.init();

      expect(cm.storage.key).toBe('cf_webapp_cookieconsent');
    });

    it('should gracefully handle teardown failures', async () => {
      const { cm } = await get();
      cm.teardown.mockImplementationOnce(() => {
        throw new Error('Teardown failure');
      });

      expect(cm.storage.key).toBe('osano_consentmanager');

      await service.init();

      expect(cm.storage.key).toBe('cf_webapp_cookieconsent');
    });

    it('should setup listeners for various events', async () => {
      const { cm } = await get();

      await service.init();

      expect(cm.on).toHaveBeenCalledWith('osano-cm-initialized', expect.any(Function));
      expect(cm.on).toHaveBeenCalledWith('osano-cm-consent-saved', expect.any(Function));
    });

    it('should call storage.setConsent if there is an item in localStorage', async () => {
      const store = getStore();
      store.get.mockReturnValue({ hello: 'world' });

      const { cm } = await get();

      await service.init();

      expect(cm.storage.setConsent).toHaveBeenCalledWith({ hello: 'world' });
    });

    it('should override whenReady and call the readyCb during initialization', async () => {
      const { cm } = await get();

      await service.init();

      expect(cm.whenReady).not.toHaveBeenCalled();
      expect(cm.whenReadyCb).toHaveBeenCalledTimes(1);
    });

    it('should call teardown if __disable_consentmanager is in localStorage', async () => {
      const store = getStore();
      store.has.mockReturnValue(true);

      const { cm } = await get();

      await service.init();

      // Torn down initially, and then due to __disable_consentmanager
      expect(cm.teardown).toHaveBeenCalledTimes(2);
    });
  });

  describe('waitForCMInstance', () => {
    beforeEach(() => {
      // `waitForCMInstance` internally sets a 100ms timeout, and we want to explicitly
      // test `setTimeout` calls, so we mock `setTimeout`.
      global.setTimeoutOrig = global.setTimeout;

      global.setTimeout = jest.fn().mockImplementation((fn) => global.setTimeoutOrig(fn));
    });

    afterEach(() => {
      global.setTimeout = global.setTimeoutOrig;
    });

    it('should retry 10 times and then throw if cm is not available', async () => {
      await expect(service.waitForCMInstance()).rejects.toThrow();
      expect(global.setTimeout).toHaveBeenCalledTimes(10);
    });

    it('should resolve if cm is available', async () => {
      await service.init();

      await expect(service.waitForCMInstance()).resolves.toBeUndefined();
    });
  });

  describe('openConsentManagementPanel', () => {
    it('should emit the "info-dialog-open" Osano event', async () => {
      const { cm } = await get();

      await service.init();

      service.openConsentManagementPanel();

      expect(cm.emit).toHaveBeenCalledWith('osano-cm-dom-info-dialog-open');
    });
  });
});
