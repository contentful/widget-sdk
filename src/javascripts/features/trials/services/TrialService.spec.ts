/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  isExpiredTrialSpace,
  isOrganizationOnTrial,
  isSpaceOnTrial,
  isTrialSpaceType,
} from './TrialService';
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

const mockSpace = fake.Space() as any;

const mockTrialSpace = fake.Space({
  trialPeriodEndsAt: trialEndsAt,
}) as any;

const trialExpiredSpace = fake.Space({
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

  describe('isTrialSpaceType', () => {
    it('should return false if the space is not Trial Space type', () => {
      expect(isTrialSpaceType(mockSpace)).toBe(false);
    });
    it('should return true if the space has been on trial before or is on an active trial', () => {
      expect(isTrialSpaceType(trialExpiredSpace)).toBe(true);
      expect(isTrialSpaceType(mockTrialSpace)).toBe(true);
    });
  });

  describe('isExpiredTrialSpace', () => {
    it('should return True if the space is expired', () => {
      expect(isExpiredTrialSpace(trialExpiredSpace)).toBe(true);
    });
    it('should return False if the space is on active trial', () => {
      expect(isExpiredTrialSpace(mockTrialSpace)).toBe(false);
    });
    it('should return False if the space is not Trial Space type', () => {
      expect(isExpiredTrialSpace(mockSpace)).toBe(false);
    });
  });
});
