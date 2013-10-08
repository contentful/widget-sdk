'use strict';

describe('Number widgets', function () {
  var elem, scope;
  beforeEach(module('contentful/test'));
  beforeEach(module(function ($compileProvider){
    $compileProvider.directive('testWidget', function (widgets, $compile) {
      return {
        link: function (scope, elem, attr) {
          var widget = widgets.editor(attr.testWidget);
          elem.html(widget.template);
          $compile(elem.contents())(scope);
          if(typeof widget.link === 'function') widget.link(scope, elem, attr);
        }
      };
    });
  }));
  beforeEach(inject(function ($rootScope) {
    scope = $rootScope;
    scope.fieldData = {value: null};
  }));
  
  describe('Number widget', function () {
    beforeEach(inject(function ($rootScope, $compile){
      elem = $compile('<div test-widget="Number"></div>')(scope);
    }));

    it('should generate 0', function () {
      elem.find('input').val('0').trigger('input');
      scope.$apply();
      expect(scope.fieldData.value).toBe(0);
    });
  });

  describe('Integer widget', function () {
    beforeEach(inject(function ($rootScope, $compile){
      elem = $compile('<div test-widget="Integer"></div>')(scope);
    }));

    it('should generate 0', function () {
      elem.find('input').val('0').trigger('input');
      scope.$apply();
      expect(scope.fieldData.value).toBe(0);
    });
  });
});

