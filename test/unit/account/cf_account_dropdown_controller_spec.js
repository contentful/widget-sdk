'use strict';

describe('Account Dropdown Controller', function () {
  beforeEach(function () {
    var stubs = this.stubs = {};

    module('contentful/test', function($provide) {
      $provide.value('analytics', stubs.analytics);
      $provide.value('authentication', stubs.authentication);
      $provide.value('$window', stubs.window);
    });

    this.stubs.analytics = {track: sinon.stub()};
    this.stubs.authentication = {logout: sinon.stub(), supportUrl: sinon.stub()};
    this.stubs.window = {
      open: sinon.stub(),
      addEventListener: sinon.stub(),
      document: window.document
    };

    var $rootScope = this.$inject('$rootScope');
    var $controller = this.$inject('$controller');
    this.scope = $rootScope.$new();
    $controller('cfAccountDropdownController', { $scope: this.scope });
  });

  it('tracks profile button click event', function () {
    this.scope.clickedProfileButton();
    sinon.assert.called(this.stubs.analytics.track);
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

  describe('open support', function () {
    beforeEach(function () {
      this.scope.openSupport();
    });

    it('opens new window', function () {
      sinon.assert.called(this.stubs.window.open);
    });

    it('gets support url', function () {
      sinon.assert.called(this.stubs.authentication.supportUrl);
    });
  });

  describe('navigation to organization settings', function () {
    beforeEach(function () {
      var OrganizationList = this.$inject('OrganizationList');
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
