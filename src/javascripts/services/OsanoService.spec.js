import { get } from 'utils/LazyLoader';
import * as service from './OsanoService';
import isAnalyticsAllowed from 'analytics/isAnalyticsAllowed';
import * as Analytics from 'analytics/Analytics';
import * as Intercom from 'services/intercom';
import * as Segment from 'analytics/segment';
import { getStore } from 'browserStorage';

import { Notification } from '@contentful/forma-36-react-components';

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
    has: jest.fn(),
  };

  return {
    getStore: jest.fn().mockReturnValue(store),
  };
});

jest.mock('services/TokenStore', () => ({
  getUserSync: jest.fn().mockReturnValue({}),
}));

jest.mock('analytics/isAnalyticsAllowed', () => jest.fn().mockReturnValue(true));

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

  describe('handleConsentChanged', () => {
    const generateConsentOptions = (analyticsAllowed = true, personalizationAllowed = true) => ({
      ANALYTICS: analyticsAllowed ? 'ACCEPT' : 'DENY',
      PERSONALIZATION: personalizationAllowed ? 'ACCEPT' : 'DENY',
      MARKETING: 'DENY',
      ESSENTIAL: 'ACCEPT',
    });

    it('should enable analytics with all Segment integrations and Intercom if analytics and personalization is allowed', async () => {
      const opts = generateConsentOptions();

      await service.handleConsentChanged(opts);

      expect(Analytics.enable).toHaveBeenCalledWith(expect.any(Object), {
        integrations: {
          all: false,
          FullStory: true,
          'Segment.io': true,
          'Google Analytics': true,
          Intercom: true,
        },
      });

      expect(Intercom.enable).toHaveBeenCalledTimes(1);
    });

    it('should disable any additional integrations from Segment', async () => {
      Segment.getIntegrations.mockResolvedValueOnce(['My Awesome Integration']);

      const opts = generateConsentOptions();

      await service.handleConsentChanged(opts);

      expect(Analytics.enable).toHaveBeenCalledWith(expect.any(Object), {
        integrations: {
          all: false,
          'My Awesome Integration': false,
          FullStory: true,
          'Segment.io': true,
          'Google Analytics': true,
          Intercom: true,
        },
      });
    });

    it('should enable analytics with only analytics Segment integrations if analytics but not personalization is allowed', async () => {
      const opts = generateConsentOptions(true, false);

      await service.handleConsentChanged(opts);

      expect(Analytics.enable).toHaveBeenCalledWith(expect.any(Object), {
        integrations: {
          all: false,
          FullStory: true,
          'Segment.io': true,
          'Google Analytics': true,
          Intercom: false,
        },
      });

      expect(Intercom.enable).not.toHaveBeenCalled();
    });

    it('should respect isAnalyticsAllowed', async () => {
      isAnalyticsAllowed.mockReturnValue(false);

      const opts = generateConsentOptions(true, false);

      await service.handleConsentChanged(opts);

      expect(Analytics.enable).not.toHaveBeenCalled();
    });

    it('should only enable Intercom (along with Segment) if analytics is denied but personalization is allowed', async () => {
      const opts = generateConsentOptions(false, true);

      await service.handleConsentChanged(opts);

      expect(Analytics.enable).not.toHaveBeenCalled();

      expect(Segment.enable).toHaveBeenCalledWith({
        integrations: {
          all: false,
          FullStory: false,
          'Segment.io': false,
          'Google Analytics': false,
          Intercom: true,
        },
      });
      expect(Intercom.enable).toHaveBeenCalledTimes(1);
    });

    it('should not enable analytics or Intercom is neither is allowed', async () => {
      const opts = generateConsentOptions(false, false);

      await service.handleConsentChanged(opts);

      expect(Analytics.enable).not.toHaveBeenCalled();
      expect(Segment.enable).not.toHaveBeenCalled();
      expect(Intercom.enable).not.toHaveBeenCalled();
    });

    it('should not attempt to do anything if previous preferences were saved', async () => {
      const opts = generateConsentOptions(false, false);

      await service.handleConsentChanged(opts);

      const newOpts = generateConsentOptions();

      await service.handleConsentChanged(newOpts);

      expect(Analytics.enable).not.toHaveBeenCalled();
      expect(Segment.enable).not.toHaveBeenCalled();
      expect(Intercom.enable).not.toHaveBeenCalled();
    });

    it('should warn the user to reload if they change their consent options', async () => {
      const opts = generateConsentOptions();

      await service.handleConsentChanged(opts);
      await service.handleConsentChanged(opts);

      expect(Notification.warning).not.toHaveBeenCalled();

      const newOpts = generateConsentOptions(false, false);

      await service.handleConsentChanged(newOpts);

      expect(Notification.warning).toHaveBeenCalledTimes(1);
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
