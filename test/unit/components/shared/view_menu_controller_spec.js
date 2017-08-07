'use strict';

describe('ViewMenuController', function () {
  beforeEach(function () {
    module('contentful/test');
    const $controller = this.$inject('$controller');
    const $rootScope = this.$inject('$rootScope');

    this.$inject('mocks/spaceContext').init();
    this.scope = $rootScope.$new();

    $controller('ViewMenuController', {
      $scope: this.scope,
      $attrs: {},
      analytics: {track: sinon.stub()},
      modalDialog: {open: sinon.stub()}
    });

    this.$apply();
  });

  describe('viewIsActive', function () {
    it('should return true if view matches tab view', function () {
      this.scope.context = { view: {id: 'foo'} };
      expect(this.scope.viewIsActive({id: 'foo'})).toBeTruthy();
      expect(this.scope.viewIsActive({id: 'bar'})).toBeFalsy();
    });
  });
});
