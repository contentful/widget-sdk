import { isOrgOnPlatformTrial } from './PlatformTrialService';
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

describe('isOrgOnPlatformTrial', () => {
  beforeEach(() => {
    const now = new Date(today).valueOf();
    jest.spyOn(Date, 'now').mockImplementation(() => now);
  });

  it('should return True if the organization is currently on platform trial', () => {
    expect(isOrgOnPlatformTrial(mockTrialOrganization)).toBe(true);
  });

  it('should return False if the trial has already ended', () => {
    expect(isOrgOnPlatformTrial(trialExpiredOrganization)).toBe(false);
  });

  it('should return False if the organization has never been on trial', () => {
    expect(isOrgOnPlatformTrial(mockOrganization)).toBe(false);
  });
});
