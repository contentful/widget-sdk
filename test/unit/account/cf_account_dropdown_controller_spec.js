'use strict';

describe('Account Dropdown Controller', function () {
  beforeEach(function () {
    const stubs = this.stubs = {};

    module('contentful/test', function ($provide) {
      $provide.value('analytics', stubs.analytics);
      $provide.value('authentication', stubs.authentication);
      $provide.value('$window', stubs.window);
    });

    this.stubs.analytics = {track: sinon.stub()};
    this.stubs.authentication = {logout: sinon.stub()};
    this.stubs.window = {
      open: sinon.stub(),
      addEventListener: sinon.stub(),
      document: window.document
    };

    const $rootScope = this.$inject('$rootScope');
    const $controller = this.$inject('$controller');
    this.scope = $rootScope.$new();
    $controller('cfAccountDropdownController', { $scope: this.scope });
  });

  describe('calls logout', function () {
    beforeEach(function () {
      this.scope.logout();
    });

    it('tracks analytics event', function () {
      sinon.assert.called(this.stubs.analytics.track);
    });

    it('logs out through authentication', function () {
      sinon.assert.called(this.stubs.authentication.logout);
    });
  });

  describe('#openSupport', function () {
    it('opens new window with support URL', function () {
      this.mockService('Config', {
        supportUrl: 'support url'
      });
      this.scope.openSupport();
      sinon.assert.calledWith(this.stubs.window.open, 'support url');
    });
  });

  describe('navigation to organization settings', function () {
    beforeEach(function () {
      const OrganizationList = this.$inject('OrganizationList');
      this.isOwnerStub = OrganizationList.isOwnerOrAdmin = sinon.stub().returns(false);
      this.$apply();
    });

    it('is disabled if the user is not an organization owner', function () {
      expect(this.scope.canGoToOrganizations).toBe(false);
    });

    it('is enabled if is the user is an organization owner', function () {
      this.isOwnerStub.returns(true);
      this.$inject('spaceContext').space = {data: {organization: {sys: {id: 42}}}};
      this.$apply();
      expect(this.scope.canGoToOrganizations).toBe(true);
    });
  });
});
