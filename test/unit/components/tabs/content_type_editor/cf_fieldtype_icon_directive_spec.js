'use strict';

describe('The cfFieldtypeIcon directive', function () {

  var container, scope;
  var compileElement;
  var stubs;

  beforeEach(function () {
    module('contentful/test', function ($provide) {
      stubs = $provide.makeStubs(['getFieldTypeName', 'logWarn']);
      $provide.value('getFieldTypeName', stubs.getFieldTypeName);
      $provide.value('logger', {
        logWarn: stubs.logWarn
      });
    });

    inject(function ($rootScope, $compile) {
      scope = $rootScope.$new();

      scope.field = {};

      compileElement = function (extra) {
        container = $('<div class="cf-fieldtype-icon" '+extra+'></div>');
        $compile(container)(scope);
        scope.$digest();
      };
    });
  });

  afterEach(function () {
    container.remove();
  });

  function makeTemplateTest(fieldType) {
    var elementNumber = _.contains(['Entries', 'Assets'], fieldType) ? 2 : 1;
    describe('injects template for '+fieldType, function() {
      beforeEach(function() {
        scope.field = {};
        stubs.getFieldTypeName.returns(fieldType);
        compileElement('field="field"');
      });

      it('does not trigger error', function() {
        sinon.assert.notCalled(stubs.logWarn);
      });

      it('has an inner element', function() {
        expect(container.children().length).toBe(elementNumber);
      });
    });
  }

  _.each([
    'Text',
    'Symbol',
    'Number',
    'Decimal Number',
    'Yes/No',
    'Date/Time',
    'Object',
    'Entry',
    'Asset',
    'Entries',
    'Assets',
    'Symbols',
    'Location'
  ], makeTemplateTest);


  describe('injects template for fallback', function() {
    beforeEach(function() {
      scope.field = {};
      stubs.getFieldTypeName.returns('');
      compileElement('field="field"');
    });

    it('does not trigger error', function() {
      sinon.assert.called(stubs.logWarn);
    });

    it('has an inner element', function() {
      expect(container.children().length).toBe(1);
    });
  });


});
