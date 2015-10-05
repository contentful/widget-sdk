'use strict';

describe('ViewMenuController', function () {
  var controller, scope, $q;

  beforeEach(module('contentful/test'));
  beforeEach(inject(function ($controller, $rootScope, _$q_) {
    $q = _$q_;
    scope = $rootScope.$new();
    controller = $controller('ViewMenuController', {
      $scope: scope,
      $attrs: {},
      analytics: {trackTotango: sinon.stub()},
      modalDialog: {open: sinon.stub()}
    });
    scope.$apply();
  }));

  describe('viewIsActive', function () {
    it('should return true if view matches tab view', function () {
      scope.context = { view: {id: 'foo'} };
      expect(scope.viewIsActive({id: 'foo'})).toBeTruthy();
      expect(scope.viewIsActive({id: 'bar'})).toBeFalsy();
    });
  });
});
