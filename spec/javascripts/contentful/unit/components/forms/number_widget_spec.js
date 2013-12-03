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

  /*
   * TODO some issue with otPath
  afterEach(inject(function ($log) {
    $log.assertEmpty();
  }));
 */

  describe('Number widget', function () {
    beforeEach(inject(function ($rootScope, $compile){
      scope.field = {type: 'Number'};
      elem = $compile('<div class="cf-number-editor"></div>')(scope);
    }));

    it('should generate 0', function () {
      elem.find('input').val('0').trigger('input');
      scope.$apply();
      expect(scope.fieldData.value).toBe(0);
      expect(elem.find('.cf-field-alert').css('display')).toBe('none');
    });

    it('should generate null for characters', function () {
      elem.find('input').val('foo').trigger('input');
      scope.$apply();
      expect(scope.fieldData.value).toBe(null);
      expect(elem.find('input').val()).toBe('foo');
    });

    it('should generate a warning for characters', function () {
      elem.find('input').val('6.').trigger('input');
      scope.$apply();
      expect(scope.fieldData.value).toBe(6);
      expect(elem.find('input').val()).toBe('6.');
      expect(elem.find('.cf-field-alert').css('display')).toBe('inline');
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
      expect(elem.find('.cf-field-alert').css('display')).toBe('none');
    });

    it('should generate null for characters', function () {
      elem.find('input').val('foo').trigger('input');
      scope.$apply();
      expect(scope.fieldData.value).toBe(null);
      expect(elem.find('input').val()).toBe('foo');
    });

    it('should generate a warning for characters', function () {
      elem.find('input').val('6.7 asd').trigger('input');
      scope.$apply();
      expect(scope.fieldData.value).toBe(6.7);
      expect(elem.find('input').val()).toBe('6.7 asd');
      expect(elem.find('.cf-field-alert').css('display')).toBe('inline');
    });
  });
});

