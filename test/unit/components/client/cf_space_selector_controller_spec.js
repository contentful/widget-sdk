'use strict';

describe('Space Selector Controller', function () {
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
    scope.spaceContext = {
      space: {
        getId: function() { return 1; },
        data: {organization: {sys: {id: 456}}}
      }
    };

    var $controller = this.$inject('$controller');
    $controller('cfSpaceSelectorController', { $scope: scope });
  });

  describe('organization list', function() {
    it('gets organization name', function () {
      scope.organizations = [
        { name: 'orgname', sys: { id: '123' } }
      ];
      scope.$digest();
      expect(scope.getOrganizationName('123')).toEqual('orgname');
    });

    it('gets no organization name', function () {
      scope.organizations = [];
      scope.$digest();
      expect(scope.getOrganizationName('123')).toEqual('');
    });
  });

  describe('watches for spaces array', function () {
    beforeEach(function () {
      scope.spaces = null;
      scope.$digest();
      scope.spaces = [
        {getId: function() { return 123; }, data: {organization: {sys: {id: 132}}}},
        {getId: function() { return 456; }, data: {organization: {sys: {id: 132}}}},
        scope.spaceContext.space
      ];
    });

    it('spaces are grouped by organization', function() {
      scope.$stateParams.spaceId = 123;
      scope.$digest();
      expect(scope.spacesByOrganization).toEqual({
        132: [scope.spaces[0], scope.spaces[1]],
        456: [scope.spaces[2]]
      });
    });
  });

  it('space switcher analytics tracking', function () {
    scope.clickedSpaceSwitcher();
    sinon.assert.called(this.analyticsStubs.track);
  });

});
