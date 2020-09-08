import { isOrganizationOnTrial, isSpaceOnTrial } from './TrialService';
import * as fake from 'test/helpers/fakeFactory';

const today = '2019-10-01T03:00:00.000Z';
const trialEndsAt = '2019-10-10';
const trialEndedAt = '2019-09-10';

const mockOrganization = fake.Organization();

const mockTrialOrganization = fake.Organization({
  trialPeriodEndsAt: trialEndsAt,
});

const trialExpiredOrganization = fake.Organization({
  trialPeriodEndsAt: trialEndedAt,
});

const mockSpace = fake.Space();

const mockTrialSpace = fake.Space({
  trialPeriodEndsAt: trialEndsAt,
});

const trialExpiredSpace = fake.Space({
  trialPeriodEndsAt: trialEndedAt,
});

describe('TrialService', () => {
  beforeEach(() => {
    const now = new Date(today).valueOf();
    jest.spyOn(Date, 'now').mockImplementation(() => now);
  });

  describe('isOrganizationOnTrial', () => {
    it('should return True if the organization is currently on platform trial', () => {
      expect(isOrganizationOnTrial(mockTrialOrganization)).toBe(true);
    });

    it('should return False if the trial has already ended', () => {
      expect(isOrganizationOnTrial(trialExpiredOrganization)).toBe(false);
    });

    it('should return False if the organization has never been on trial', () => {
      expect(isOrganizationOnTrial(mockOrganization)).toBe(false);
    });
  });

  describe('isSpaceOnTrial', () => {
    it('should return True if the space is currently on trial', () => {
      expect(isSpaceOnTrial(mockTrialSpace)).toBe(true);
    });

    it('should return False if the trial has already ended', () => {
      expect(isSpaceOnTrial(trialExpiredSpace)).toBe(false);
    });

    it('should return False if the organization has never been on trial', () => {
      expect(isSpaceOnTrial(mockSpace)).toBe(false);
    });
  });
});
