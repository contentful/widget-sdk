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

  describe('allows navigation to organization settings', function () {
    beforeEach(function () {
      var OrganizationList = this.$inject('OrganizationList');
      this.isOwnerStub = OrganizationList.isOwner = sinon.stub().returns(false);
      this.$apply();
    });

    it('disables if is not an owner of an organization', function () {
      expect(this.scope.canGoToSubscription).toBe(false);
    });

    it('enables if is an owner of an organization', function () {
      this.isOwnerStub.returns(true);
      this.$inject('spaceContext').space = {data: {organization: {sys: {id: 42}}}};
      this.$apply();
      expect(this.scope.canGoToSubscription).toBe(true);
    });
  });
});
