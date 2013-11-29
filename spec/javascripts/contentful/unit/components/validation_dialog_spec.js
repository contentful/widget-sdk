'use strict';

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
