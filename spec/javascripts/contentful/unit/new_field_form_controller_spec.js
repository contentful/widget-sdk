'use strict';

describe('New Field Form', function () {
  var controller;

  beforeEach(function () {
    module('contentful/test');
  });

  beforeEach(inject(function ($compile, $rootScope, $controller) {
    $rootScope.contentType = { data: { fields: [] } };
    $rootScope.validationResult = {};
    $rootScope.displayEnabled = angular.noop;
    controller = $controller('newFieldFormCtrl', {$scope: $rootScope});
  }));

  afterEach(inject(function ($log) {
    $log.assertEmpty();
  }));

  describe('Changing the Field Type', function () {
    var availableTypes, text, list;

    beforeEach(inject(function (availableFieldTypes) {
      availableTypes = availableFieldTypes;
      text = _.find(availableTypes, {name: 'Text'});
      list = _.find(availableTypes, {name: 'List of Symbols'});
    }));

    it('should add the newField properties', inject(function ($rootScope) {
      $rootScope.selectType(list);
      $rootScope.$apply();
      expect($rootScope.newField.type).toEqual('Array');
      expect($rootScope.newField.items).toLookEqual({type: 'Symbol'});
    }));

    it('should remove the newField properties', inject(function ($rootScope) {
      $rootScope.selectType(list);
      $rootScope.$apply();
      expect($rootScope.newField.items).toBeDefined();
      $rootScope.selectType(text);
      $rootScope.$apply();
      expect($rootScope.newField.items).not.toBeDefined();
    }));

    it('should reset the newField properties properly', inject(function ($rootScope) {
      $rootScope.otDoc = {
        setAt: angular.noop,
        at: function () {
          return {
            push: function (field, callback) { callback(null); }
          };
        }
      };
      $rootScope.otUpdateEntity = angular.noop;
      $rootScope.selectType(list);
      $rootScope.$apply();
      expect($rootScope.newField.items).toBeDefined();
      $rootScope.addField();
      expect($rootScope.newField.items).not.toBeDefined();
    }));
  });

});
