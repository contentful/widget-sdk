describe('data/Org', () => {
  beforeEach(function() {
    module('contentful/test');

    this.orgUtils = this.$inject('data/Org');
  });

  describe('#isOrgPlanEnterprise', () => {
    beforeEach(function() {
      this.assertIfEnterprise = function(planNames, isEnterprise) {
        planNames.forEach(planName => {
          const output = this.orgUtils.isOrgPlanEnterprise({
            subscriptionPlan: { name: planName }
          });

          expect(output).toEqual(isEnterprise);
        });
      };
    });

    it('should return true for org that is on an enterprise plan', function() {
      const planNames = [
        'enterprise',
        'Enterprise',
        'xxl EnterPrise',
        'Oh my what an ENTERPRISE',
        'Such a cool eNtErPrIsE',
        '123 enterprise 123',
        'best enterpriSE 2017',
        'ENTERPRISE',
        'Business (Quarterly)',
        'business (quarterly)',
        'Business (Monthly)',
        'Business (Annual)',
        'Scale (Quarterly)',
        'Scale (Monthly)',
        'Scale (Annual)',
        'scale (annual)'
      ];

      this.assertIfEnterprise(planNames, true);
    });

    it('should return false otherwise', function() {
      const planNames = [
        '',
        undefined,
        123,
        'Professional Edition',
        'enter prise',
        'Business',
        'Business (half-year)',
        'scale',
        'scale (yearly)'
      ];

      this.assertIfEnterprise(planNames, false);
    });
  });
});
