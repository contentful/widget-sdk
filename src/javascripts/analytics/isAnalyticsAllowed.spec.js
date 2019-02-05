import isAnalyticsAllowed from './isAnalyticsAllowed.es6';

describe('isAnalyticsAllowed', () => {
  const makeUser = () => ({
    features: { logAnalytics: true },
    organizationMemberships: [{ organization: { disableAnalytics: false } }]
  });

  it('should allow by default', () => {
    expect(isAnalyticsAllowed(makeUser())).toBe(true);
  });

  it('should disallow when user has analytics disabled', () => {
    const user = makeUser();
    user.features.logAnalytics = false;
    expect(isAnalyticsAllowed(user)).toBe(false);
  });

  it('should disallow if user has one organization with analytics disabled', () => {
    const user = makeUser();
    user.organizationMemberships.push({ organization: { disableAnalytics: true } });
    expect(isAnalyticsAllowed(user)).toBe(false);
  });
});
