/* eslint-disable @typescript-eslint/no-explicit-any */
import { isOrganizationOnTrial } from './TrialService';
import * as fake from 'test/helpers/fakeFactory';

const today = '2019-10-01T03:00:00.000Z';
const trialEndsAt = '2019-10-10';
const trialEndedAt = '2019-09-10';

const mockOrganization = fake.Organization() as any;

const mockTrialOrganization = fake.Organization({
  trialPeriodEndsAt: trialEndsAt,
}) as any;

const trialExpiredOrganization = fake.Organization({
  trialPeriodEndsAt: trialEndedAt,
}) as any;

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
});
