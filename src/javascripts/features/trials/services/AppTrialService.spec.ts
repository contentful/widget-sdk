import * as fake from 'test/helpers/fakeFactory';
import { getAppTrialSpaceKey, isActiveAppTrial, isExpiredAppTrial } from './AppTrialService';
import { AppTrialFeature } from '../types/AppTrial';
import { getSpaces } from 'services/TokenStore';

const today = '2019-10-01T03:00:00.000Z';
const trialEndsAt = '2019-10-10';
const trialEndedAt = '2019-09-10';

const mockOrganization = fake.Organization();

const activeAppTrial = {
  enabled: true,
  sys: {
    organization: {
      sys: {
        id: mockOrganization.sys.id,
      },
    },
    trial: {
      endsAt: trialEndsAt,
    },
  },
} as AppTrialFeature;

const expiredAppTrial = {
  enabled: false,
  sys: {
    organization: {
      sys: {
        id: mockOrganization.sys.id,
      },
    },
    trial: {
      endsAt: trialEndedAt,
    },
  },
} as AppTrialFeature;

const purchasedWithoutTrial = {
  enabled: true,
  sys: {
    organization: {
      sys: {
        id: mockOrganization.sys.id,
      },
    },
  },
} as AppTrialFeature;

const purchasedAppTrial = {
  enabled: true,
  sys: {
    organization: {
      sys: {
        id: mockOrganization.sys.id,
      },
    },
    trial: {
      endsAt: trialEndedAt,
    },
  },
} as AppTrialFeature;

const appTrialNotStarted = {
  enabled: false,
  sys: {
    organization: {
      sys: {
        id: mockOrganization.sys.id,
      },
    },
  },
} as AppTrialFeature;

const mockTrialSpaceOne = fake.Space({
  organization: {
    sys: {
      id: mockOrganization.sys.id,
    },
  },
  trialPeriodEndsAt: trialEndsAt,
});

const mockTrialSpaceTwo = fake.Space({
  organization: {
    sys: {
      id: 'another org',
    },
  },
  trialPeriodEndsAt: trialEndsAt,
});

const mockExpiredTrialSpace = fake.Space({
  organization: {
    sys: {
      id: mockOrganization.sys.id,
    },
  },
  trialPeriodEndsAt: trialEndedAt,
});

const mockSpace = fake.Space();

jest.mock('services/TokenStore', () => ({
  getSpaces: jest.fn(),
}));

describe('AppTrialService', () => {
  beforeEach(() => {
    (getSpaces as jest.Mock).mockResolvedValue([mockTrialSpaceOne, mockTrialSpaceTwo, mockSpace]);
    const now = new Date(today).valueOf();
    jest.spyOn(Date, 'now').mockImplementation(() => now);
  });

  describe('isActiveAppTrial', () => {
    it('should return True if the App Trial is on-going', () => {
      expect(isActiveAppTrial(activeAppTrial)).toBe(true);
    });

    it('should return False if the App Trial has already ended', () => {
      expect(isActiveAppTrial(expiredAppTrial)).toBe(false);
    });

    it('should return False if the App is purchased', () => {
      expect(isActiveAppTrial(purchasedAppTrial)).toBe(false);
      expect(isActiveAppTrial(purchasedWithoutTrial)).toBe(false);
    });

    it('should return False if the App Trial is not started', () => {
      expect(isActiveAppTrial(appTrialNotStarted)).toBe(false);
    });
  });

  describe('isExpiredAppTrial', () => {
    it('should return True if the App Trial has already ended', () => {
      expect(isExpiredAppTrial(expiredAppTrial)).toBe(true);
    });

    it('should return False if the App Trial is on-going', () => {
      expect(isExpiredAppTrial(activeAppTrial)).toBe(false);
    });

    it('should return False if the App is purchased', () => {
      expect(isExpiredAppTrial(purchasedAppTrial)).toBe(false);
      expect(isExpiredAppTrial(purchasedWithoutTrial)).toBe(false);
    });

    it('should return False if the App Trial is not started', () => {
      expect(isExpiredAppTrial(appTrialNotStarted)).toBe(false);
    });
  });

  describe('getAppTrialSpaceKey', () => {
    it('should return the correct Space Id of the Trial Space when the App Trial is active', async () => {
      expect(await getAppTrialSpaceKey(activeAppTrial)).toBe(mockTrialSpaceOne.sys.id);
    });
    it('should return the correct Space Id of the Trial Space when the App Trial is expired', async () => {
      (getSpaces as jest.Mock).mockResolvedValue([
        mockExpiredTrialSpace,
        mockTrialSpaceTwo,
        mockSpace,
      ]);
      expect(await getAppTrialSpaceKey(expiredAppTrial)).toBe(mockExpiredTrialSpace.sys.id);
    });
    it('should return null if the Trial Space cannot be found in the user Token', async () => {
      (getSpaces as jest.Mock).mockResolvedValue([]);

      expect(await getAppTrialSpaceKey(activeAppTrial)).toBeNull();
    });
    it('should return null if the App Trial is never started', async () => {
      expect(await getAppTrialSpaceKey(appTrialNotStarted)).toBeNull();
    });
  });
});
