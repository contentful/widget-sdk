'use strict';

describe('Account Dropdown Controller', function () {
  var scope;

  beforeEach(function() {
    var self = this;

    module('contentful/test');
    module(function($provide) {
      self.windowStubs = { open: sinon.stub(), addEventListener: sinon.stub() };
      self.analyticsStubs = { track: sinon.stub() };
      self.authenticationStubs = { logout: sinon.stub(), supportUrl: sinon.stub() };
      $provide.value('$window', self.windowStubs);
      $provide.value('analytics', self.analyticsStubs);
      $provide.value('authentication', self.authenticationStubs);
    });

    var $rootScope = this.$inject('$rootScope');
    scope = $rootScope.$new();

    var $controller = this.$inject('$controller');
    $controller('cfAccountDropdownController', { $scope: scope });
  });

  it('tracks profile button click event', function () {
    scope.clickedProfileButton();
    sinon.assert.called(this.analyticsStubs.track);
  });

  describe('calls logout', function() {
    beforeEach(function() {
      scope.logout();
    });

    it('tracks analytics event', function() {
      sinon.assert.called(this.analyticsStubs.track);
    });

    it('logs out through authentication', function() {
      sinon.assert.called(this.authenticationStubs.logout);
    });
  });

  describe('open support', function() {
    beforeEach(function () {
      scope.openSupport();
    });

    it('opens new window', function() {
      sinon.assert.called(this.windowStubs.open);
    });

    it('gets support url', function() {
      sinon.assert.called(this.authenticationStubs.supportUrl);
    });
  });
});
