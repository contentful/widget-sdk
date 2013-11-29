'use strict';

describe('ContentType field validation dialog Controller', function () {
  var controller, scope;
  var canStub;
  beforeEach(module('contentful/test', function ($provide) {
    canStub = sinon.stub();
    $provide.value('can', canStub);
  }));

  beforeEach(inject(function ($compile, $rootScope, $controller){
    scope = $rootScope;
    scope.field = {};
    scope.can = canStub;
    controller = $controller('FieldValidationDialogController', {$scope: scope});
    scope.$digest();
  }));

  afterEach(inject(function ($log) {
    $log.assertEmpty();
  }));

  it('can add validations', function () {
    canStub.withArgs('create', 'ContentType').returns(true);
    scope.availableValidations = [{}];
    scope.$apply();
    expect(scope.canAddValidations()).toBeTruthy();
  });

  it('cannot add validations', function () {
    canStub.withArgs('create', 'ContentType').returns(false);
    scope.availableValidations = [{}];
    scope.$apply();
    expect(scope.canAddValidations()).toBeFalsy();
  });

});
