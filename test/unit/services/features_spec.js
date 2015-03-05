'use strict';

describe('Features service', function(){
  beforeEach(function(){
    module('contentful/test');
    this.authentication = this.$inject('authentication');
    this.features       = this.$inject('features');
  });

  describe('shouldAllowAnalytics', function(){
    beforeEach(function(){
      this.authentication.getUser = function(){
        return this.user;
      }.bind(this);
      this.user = {
        features: { logAnalytics: true },
        organizationMemberships: [
          {organization: {disableAnalytics: false}}
        ]
      };
    });

    it('should allow by default', function() {
      expect(this.features.shouldAllowAnalytics()).toBe(true);
    });

    it('should disallow when user has analytics disabled', function() {
      this.user.features.logAnalytics = false;
      expect(this.features.shouldAllowAnalytics()).toBe(false);
    });

    it('should disallow if user has one organization with analytics disabled', function() {
      this.user.organizationMemberships.push({
        organization: {disableAnalytics: true}
      });
      expect(this.features.shouldAllowAnalytics()).toBe(false);
    });
  });
});
