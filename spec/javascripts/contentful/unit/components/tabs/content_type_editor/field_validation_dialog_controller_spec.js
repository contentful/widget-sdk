'use strict';

// TODO cleanup this file

describe('Validation Dialog', function () {
  var scope, controller;
  beforeEach(module('contentful/test'));

  beforeEach(inject(function ($controller, $rootScope){
    scope = $rootScope;
    scope.field = {
      'name': 'aaa',
      'id': 'aaa',
      'type': 'Text',
      'uiid': '4718xi6vshs',
      //'validations': [ { 'in': null } ]
    };
    controller = $controller('FieldValidationDialogController', {$scope: scope});
    scope.$apply();
  }));

  afterEach(inject(function ($log) {
    $log.assertEmpty();
  }));

  it('should remove used validations from list of available validations', function () {
    expect(_.keys(scope.availableValidations).length).toBe(3);
    expect(_.keys(scope.availableValidations)).toContain('Predefined Values');
    scope.field.validations = [ { 'in': null } ];
    scope.$apply();
    expect(_.keys(scope.availableValidations).length).toBe(2);
    expect(_.keys(scope.availableValidations)).not.toContain('Predefined Values');
  });
});

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
