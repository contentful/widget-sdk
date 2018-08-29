'use strict';

describe('Features service', () => {
  beforeEach(function() {
    module('contentful/test');

    this.user = {
      features: {
        logAnalytics: true
      },
      organizationMemberships: [{ organization: { disableAnalytics: false } }]
    };

    this.features = this.$inject('features');
  });

  describe('#allowAnalytics', () => {
    it('should allow by default', function() {
      expect(this.features.allowAnalytics(this.user)).toBe(true);
    });

    it('should disallow when user has analytics disabled', function() {
      this.user.features.logAnalytics = false;
      expect(this.features.allowAnalytics(this.user)).toBe(false);
    });

    it('should disallow if user has one organization with analytics disabled', function() {
      this.user.organizationMemberships.push({
        organization: { disableAnalytics: true }
      });
      expect(this.features.allowAnalytics(this.user)).toBe(false);
    });
  });
});
