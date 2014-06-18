'use strict';

describe('ViewMenuController', function () {
  var controller, scope, $q;

  beforeEach(module('contentful/test'));
  beforeEach(inject(function ($controller, $rootScope, _$q_) {
    $q = _$q_;
    scope = $rootScope.$new();
    scope.current = {view: null};
    controller = $controller('ViewMenuController', {
      $scope: scope,
      $attrs: {currentView: 'current.view'},
      analytics: {trackTotango: sinon.stub()},
      modalDialog: {open: sinon.stub()}
    });
    scope.$apply();
  }));
  afterEach(inject(function ($log) {
    $log.assertEmpty();
  }));

  describe('viewIsActive', function () {
    it('should return true if view matches tab view', function () {
      scope.current.view = {id: 'foo'};
      expect(scope.viewIsActive({id: 'foo'})).toBeTruthy();
      expect(scope.viewIsActive({id: 'bar'})).toBeFalsy();
    });
  });
});
