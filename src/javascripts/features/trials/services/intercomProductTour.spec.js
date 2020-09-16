import * as Intercom from 'services/intercom';
import {
  initTrialProductTour,
  INTERCOM_PLATFORM_TRIAL_TOUR_ID,
  INTERCOM_TRIAL_SPACE_TOUR_ID,
} from './intercomProductTour';
import * as fake from 'test/helpers/fakeFactory';
import { getBrowserStorage } from 'core/services/BrowserStorage';

const trialEndsAt = '2020-10-10';
const organizationNotOnTrial = fake.Organization();
const spaceNotOnTrial = fake.Space();
const trialOrganization = fake.Organization({
  trialPeriodEndsAt: trialEndsAt,
});

const trialSpace = fake.Space({
  organization: organizationNotOnTrial,
  trialPeriodEndsAt: trialEndsAt,
});

jest.mock('services/intercom', () => ({
  startTour: jest.fn(),
}));

jest.mock('core/services/BrowserStorage', () => {
  const store = {
    get: jest.fn(),
    set: jest.fn(),
  };

  return {
    getBrowserStorage: jest.fn().mockReturnValue(store),
  };
});

describe('Trial/IntercomProductTour', () => {
  it('should return when both org and space on trial', () => {
    initTrialProductTour(trialSpace, trialOrganization);
    expect(Intercom.startTour).toHaveBeenCalledTimes(0);
  });

  it('should return when no org and space are provided', () => {
    initTrialProductTour(undefined, undefined);
    expect(Intercom.startTour).toHaveBeenCalledTimes(0);
  });

  describe('Enterprise Trial', () => {
    it('should start enterprise trial intercom product tour', () => {
      initTrialProductTour(spaceNotOnTrial, trialOrganization);

      expect(Intercom.startTour).toBeCalledWith(INTERCOM_PLATFORM_TRIAL_TOUR_ID);
      expect(Intercom.startTour).toHaveBeenCalledTimes(1);
    });

    it('should not start enterprise trial intercom product tour if it has already been played', () => {
      const storeData = {
        orgIds: [trialOrganization.sys.id],
      };

      const store = getBrowserStorage();
      store.get.mockReturnValue(storeData);

      initTrialProductTour(spaceNotOnTrial, trialOrganization);

      expect(Intercom.startTour).toHaveBeenCalledTimes(0);
    });
  });

  describe('Trial Space', () => {
    it('should start trial space intercom product tour', () => {
      initTrialProductTour(trialSpace, organizationNotOnTrial);

      expect(Intercom.startTour).toBeCalledWith(INTERCOM_TRIAL_SPACE_TOUR_ID);
      expect(Intercom.startTour).toHaveBeenCalledTimes(1);
    });

    it('should not start space trial intercom product tour if it has already been played already', () => {
      const storeData = {
        spaceIds: [trialSpace.sys.id],
      };

      const store = getBrowserStorage();
      store.get.mockReturnValue(storeData);

      initTrialProductTour(trialSpace, organizationNotOnTrial);

      expect(Intercom.startTour).toHaveBeenCalledTimes(0);
    });
  });
});
