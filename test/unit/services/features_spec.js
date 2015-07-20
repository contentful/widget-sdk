'use strict';

describe('Features service', function(){
  beforeEach(function(){
    module('contentful/test');
    this.authentication = this.$inject('authentication');
    this.authentication.getUser = function(){
      return this.user;
    }.bind(this);
    this.user = {
      features: {
        logAnalytics: true
      },
      organizationMemberships: [
        {organization: {disableAnalytics: false}}
      ]
    };

    this.features = this.$inject('features');
  });

  describe('isPreviewEnabled', function() {
    it('is enabled', function() {
      this.user.features.showPreview = true;
      expect(this.features.isPreviewEnabled()).toBe(true);
    });

    it('is disabled', function() {
      expect(this.features.isPreviewEnabled()).toBe(false);
    });

  });

  describe('shouldAllowAnalytics', function(){
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
