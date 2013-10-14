'use strict';

describe('Number widgets', function () {
  var elem, scope;
  beforeEach(module('contentful/test'));
  beforeEach(inject(function ($rootScope) {
    scope = $rootScope;
    scope.fieldData = {value: null};
    scope.field = {type: null};
    scope.otEditable = true;
  }));
  
  describe('Number widget', function () {
    beforeEach(inject(function ($rootScope, $compile){
      scope.field = {type: 'Number'};
      elem = $compile('<div class="cf-number-editor"></div>')(scope);
    }));

    it('should generate 0', function () {
      elem.find('input').val('0').trigger('input');
      scope.$apply();
      expect(scope.fieldData.value).toBe(0);
    });
  });

  describe('Integer widget', function () {
    beforeEach(inject(function ($rootScope, $compile){
      scope.field = {type: 'Number'};
      elem = $compile('<div class="cf-number-editor"></div>')(scope);
    }));

    it('should generate 0', function () {
      elem.find('input').val('0').trigger('input');
      scope.$apply();
      expect(scope.fieldData.value).toBe(0);
    });
  });
});

