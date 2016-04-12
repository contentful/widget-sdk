'use strict';

describe('TheAccountView service', function () {
  beforeEach(function () {
    module('contentful/test');
    this.view = this.$inject('TheAccountView');
    var $state = this.$inject('$state');
    this.go = $state.go = sinon.spy();
  });

  describe('(in)active state', function () {
    it('is inactive by default', function () {
      expect(this.view.isActive()).toBe(false);
    });

    it('marks as active on enter', function () {
      this.view.enter();
      expect(this.view.isActive()).toBe(true);
    });

    it('marks as inactive on exit', function () {
      this.view.enter();
      this.view.exit();
      expect(this.view.isActive()).toBe(false);
    });
  });

  describe('navigation', function () {
    it('#goToUserProfile navigates to user profile', function () {
      this.view.goToUserProfile();
      sinon.assert.calledOnce(this.go.withArgs('account.pathSuffix', {pathSuffix: 'profile/user'}));
    });

    it('#goToSubscription navigates to plan details', function () {
      var organizationId = 'XYZ';
      var expectedParams = {pathSuffix: 'organizations/' + organizationId + '/subscription'};

      var spaceContext = this.$inject('spaceContext');
      spaceContext.space = {};
      dotty.put(spaceContext, 'space.data.organization.sys.id', organizationId);
      this.$inject('OrganizationList').isOwner = _.constant(true);

      this.view.goToSubscription();
      sinon.assert.calledOnce(this.go.withArgs('account.pathSuffix', expectedParams, {reload: true}));
    });

    it('#silentlyChangeState replaces URL', function () {
      this.view.silentlyChangeState('x/y');
      sinon.assert.calledOnce(this.go.withArgs('account.pathSuffix', {pathSuffix: 'x/y'}, {location: 'replace'}));
    });
  });
});
