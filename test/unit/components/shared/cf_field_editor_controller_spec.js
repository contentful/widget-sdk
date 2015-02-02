'use strict';

describe('cfFieldEditor Controller', function () {
  var scope, createController;
  beforeEach(function () {
    module('contentful/test');
    inject(function ($controller, $rootScope) {
      scope = $rootScope.$new();
      scope.external = {data: {}};

      createController = function () {
        $controller('CfFieldEditorController', {
          $scope: scope,
          $attrs: {cfFieldEditor: 'external.data'}
        });
        scope.$apply();
      };
    });
  });

  it('updates fieldData from external', function () {
    scope.external.data = 'external';
    createController();
    expect(scope.fieldData.value).toEqual('external');

    scope.external.data = 'updated external';
    scope.$digest();
    expect(scope.fieldData.value).toEqual('updated external');
  });

  it('updates external data from fieldData', function () {
    scope.external.data = 'external';
    createController();
    expect(scope.fieldData.value).toEqual('external');

    scope.fieldData.value = 'updated field';
    scope.$digest();
    expect(scope.external.data).toEqual('updated field');
  });


  describe('without external data', function() {
    beforeEach(function() {
      delete scope.external;
      createController();
    });

    it('does not set fieldData value on init', function() {
      expect(scope.fieldData.value).toBeUndefined();
    });

    it('updates external value on change and creates field', function() {
      scope.external = {data: 'external'};
      scope.$digest();
      expect(scope.fieldData.value).toBe('external');
    });
  });

});

