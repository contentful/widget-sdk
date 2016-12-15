'use strict';

describe('Space Selector Controller', function () {
  let scope, analytics, $stateParams;

  afterEach(function () {
    scope = analytics = $stateParams = null;
  });

  beforeEach(function () {
    module('contentful/test');

    const $rootScope = this.$inject('$rootScope');
    const $controller = this.$inject('$controller');
    const spaceContext = this.$inject('spaceContext');
    analytics = this.$inject('analytics');
    sinon.stub(analytics, 'track');
    $stateParams = this.$inject('$stateParams');

    scope = $rootScope.$new();
    spaceContext.space = {
      getId: function () { return 1; },
      data: { organization: { sys: { id: 456 } } }
    };

    $controller('cfSpaceSelectorController', { $scope: scope });
  });

  describe('watches for spaces array', function () {
    beforeEach(function () {
      scope.spaces = null;
      scope.$digest();
      scope.spaces = [
        {getId: function () { return 123; }, data: {organization: {sys: {id: 132}}}},
        {getId: function () { return 456; }, data: {organization: {sys: {id: 132}}}},
        scope.spaceContext.space
      ];
    });

    it('spaces are grouped by organization', function () {
      $stateParams.spaceId = 123;
      scope.$digest();
      expect(scope.spacesByOrganization).toEqual({
        132: [scope.spaces[0], scope.spaces[1]],
        456: [scope.spaces[2]]
      });
    });
  });

  it('space switcher analytics tracking', function () {
    scope.clickedSpaceSwitcher();
    sinon.assert.called(analytics.track);
  });
});
