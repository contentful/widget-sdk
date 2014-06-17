'use strict';

describe('The cfPredefinedValuesList directive', function () {

  var container, scope;
  var compileElement;
  var stubs;

  beforeEach(function () {
    module('contentful/test', function ($provide) {
      stubs = $provide.makeStubs([]);
    });

    inject(function ($rootScope, $compile) {
      scope = $rootScope.$new();

      scope.validation = {
        in: []
      };

      compileElement = function () {
        container = $('<div class="cf-predefined-values-list"></div>');
        $compile(container)(scope);
        scope.$digest();
      };
    });
  });

  afterEach(inject(function ($log) {
    container.remove();
    $log.assertEmpty();
  }));

  describe('renders existing values', function() {
    beforeEach(function() {
      scope.validation.in = ['value1', 'value2'];
      compileElement();
    });

    it('has 2 items', function() {
      expect(container.find('li').length).toBe(2);
    });

    it('has value1', function() {
      expect(parseInt(container.find('li').eq(0).attr('index'), 10)).toEqual(0);
    });

    it('has value2', function() {
      expect(parseInt(container.find('li').eq(1).attr('index'), 10)).toEqual(1);
    });
  });

});
