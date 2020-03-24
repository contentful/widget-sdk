import { get } from 'utils/LazyLoader';
import * as service from './OsanoService';
import isAnalyticsAllowed from 'analytics/isAnalyticsAllowed';
import * as Analytics from 'analytics/Analytics';
import * as Intercom from 'services/intercom';
import * as Segment from 'analytics/segment';

import { Notification } from '@contentful/forma-36-react-components';

jest.mock('lodash/debounce', () => fn => fn);

jest.mock('utils/LazyLoader', () => {
  const getValue = {
    cm: {
      on: jest.fn(),
      emit: jest.fn(),
      setup: jest.fn(),
      teardown: jest.fn()
    }
  };

  return {
    get: jest.fn().mockResolvedValue(getValue)
  }
});

jest.mock('services/TokenStore', () => ({
  getUserSync: jest.fn().mockReturnValue({})
}));

jest.mock('analytics/isAnalyticsAllowed', () => jest.fn().mockReturnValue(true));

jest.mock('services/intercom', () => ({
  enable: jest.fn()
}));

jest.mock('analytics/segment', () => ({
  enable: jest.fn()
}));

jest.spyOn(Notification, 'warning').mockImplementation(() => {});

describe('OsanoService', () => {
  beforeEach(service.__reset);

  describe('handleConsentChanged', () => {
    const generateConsentOptions = (analyticsAllowed = true, personalizationAllowed = true) => ({
      ANALYTICS: analyticsAllowed ? 'ACCEPT' : 'DENY',
      PERSONALIZATION: personalizationAllowed ? 'ACCEPT' : 'DENY',
      MARKETING: 'DENY',
      ESSENTIAL: 'ACCEPT'
    });

    it('should enable analytics with all Segment integrations and Intercom if analytics and personalization is allowed', () => {
      const opts = generateConsentOptions();

      service.handleConsentChanged(opts);

      expect(Analytics.enable).toHaveBeenCalledWith(expect.any(Object), {
        integrations: {
          all: false,
          'Segment.io': true,
          'Google Analytics': true,
          Intercom: true
        }
      });

      expect(Intercom.enable).toHaveBeenCalledTimes(1);
    });

    it('should enable analytics with only analytics Segment integrations if analytics but not personalization is allowed', () => {
      const opts = generateConsentOptions(true, false);

      service.handleConsentChanged(opts);

      expect(Analytics.enable).toHaveBeenCalledWith(expect.any(Object), {
        integrations: {
          all: false,
          'Segment.io': true,
          'Google Analytics': true,
          Intercom: false
        }
      });

      expect(Intercom.enable).not.toHaveBeenCalled();
    });

    it('should respect isAnalyticsAllowed', () => {
      isAnalyticsAllowed.mockReturnValue(false);

      const opts = generateConsentOptions(true, false);

      service.handleConsentChanged(opts);

      expect(Analytics.enable).not.toHaveBeenCalled();
    });

    it('should only enable Intercom (along with Segment) if analytics is denied but personalization is allowed', () => {
      const opts = generateConsentOptions(false, true);

      service.handleConsentChanged(opts);

      expect(Analytics.enable).not.toHaveBeenCalled();

      expect(Segment.enable).toHaveBeenCalledWith({
        integrations: {
          all: false,
          'Segment.io': false,
          'Google Analytics': false,
          Intercom: true
        }
      });
      expect(Intercom.enable).toHaveBeenCalledTimes(1);
    });

    it('should not enable analytics or Intercom is neither is allowed', () => {
      const opts = generateConsentOptions(false, false);

      service.handleConsentChanged(opts);

      expect(Analytics.enable).not.toHaveBeenCalled();
      expect(Segment.enable).not.toHaveBeenCalled();
      expect(Intercom.enable).not.toHaveBeenCalled();
    });

    it('should not attempt to do anything if previous preferences were saved', () => {
      const opts = generateConsentOptions(false, false);

      service.handleConsentChanged(opts);

      const newOpts = generateConsentOptions();

      service.handleConsentChanged(newOpts);

      expect(Analytics.enable).not.toHaveBeenCalled();
      expect(Segment.enable).not.toHaveBeenCalled();
      expect(Intercom.enable).not.toHaveBeenCalled();
    });

    it('should warn the user to reload if they change their consent options', () => {
      const opts = generateConsentOptions();

      service.handleConsentChanged(opts);
      service.handleConsentChanged(opts);

      expect(Notification.warning).not.toHaveBeenCalled();

      const newOpts = generateConsentOptions(false, false);

      service.handleConsentChanged(newOpts);

      expect(Notification.warning).toHaveBeenCalledTimes(1);
    });
  });

  describe('init', () => {
    it('should get Osano from LazyLoader', async () => {
      await service.init();

      expect(get).toHaveBeenCalled();
    });

    it('should only call the LazyLoader once, even after multiple init calls', async() => {
      await service.init();
      await service.init();
      await service.init();

      expect(get).toHaveBeenCalledTimes(1);
    });

    it('should setup listeners for various events', async () => {
      const { cm } = await get();

      await service.init();

      expect(cm.on).toHaveBeenCalledWith('osano-cm-initialized', expect.any(Function));
      expect(cm.on).toHaveBeenCalledWith('osano-cm-consent-changed', expect.any(Function));
      expect(cm.on).toHaveBeenCalledWith('osano-cm-consent-saved', expect.any(Function));
    });

    it('should force the cm instance to teardown if __disable_consentmanager is present in localStorage', async() => {
      global.localStorage.setItem('__disable_consentmanager', 'true');

      const { cm } = await get();

      await service.init();

      expect(cm.teardown).toHaveBeenCalled();

      global.localStorage.removeItem('__disable_consentmanager');
    });
  });

  describe('waitForCMInstance', () => {
    beforeEach(() => {
      global.setTimeoutOrig = global.setTimeout;

      global.setTimeout = jest.fn().mockImplementation((fn) => global.setTimeoutOrig(fn));
    });

    afterEach(() => {
      global.setTimeout = global.setTimeoutOrig;
    })

    it('should retry 10 times and then throw if cm is not available', async () => {
      await expect(service.waitForCMInstance()).rejects.toThrow();
      expect(global.setTimeout).toHaveBeenCalledTimes(10);
    });

    it('should resolve if cm is available', async () => {
      await service.init();

      await expect(service.waitForCMInstance()).resolves.toBeUndefined();
    })
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
