'use strict';

describe('The can directive', function () {

  var container, elem, scope;
  var canStub;
  var usageStub;
  var compileElement;

  beforeEach(function () {
    canStub = sinon.stub();
    usageStub = sinon.stub();
    module('contentful/test', function ($provide) {
      $provide.value('can', canStub);
      $provide.value('authorization', {
        spaceContext: {}
      });
      $provide.value('determineEnforcement', {
        computeUsage: usageStub
      });
    });
    inject(function ($rootScope, $compile) {
      scope = $rootScope.$new();
      scope.can = canStub;

      compileElement = function (extra) {
        container = $('<div><div cf-can="can(\'create\', \'Entry\')" '+extra+'></div></div>');
        $compile(container)(scope);
        scope.$digest();
        elem = container.find('[cf-can]');
      };
    });
  });

  afterEach(inject(function ($log) {
    container.remove();
    $('.transparent-button-layer').remove();
    $log.assertEmpty();
  }));


  describe('lets the element be used', function () {
    beforeEach(function () {
      canStub.returns(true);
      compileElement();
    });

    it('has no hide class', function () {
      expect(elem.hasClass('ng-hide')).toBeFalsy();
    });

    it('is not deactivated', function () {
      expect(elem.attr('disabled')).toBeFalsy();
    });
  });

  describe('hides the element', function () {
    beforeEach(function () {
      canStub.returns(false);
      compileElement();
    });

    it('has a hide class', function () {
      expect(elem.hasClass('ng-hide')).toBeTruthy();
    });

    it('is deactivated', function () {
      expect(elem.attr('disabled')).toBeFalsy();
    });
  });

  describe('disables the element', function () {
    var tooltipStub;
    beforeEach(function () {
      tooltipStub = sinon.stub($.fn, 'tooltip');
      canStub.returns(false);
      usageStub.returns('reasons');
      compileElement('cf-can-entity="entry"');
    });

    afterEach(function () {
      tooltipStub.restore();
    });

    it('has no hide class', function () {
      expect(elem.hasClass('ng-hide')).toBeFalsy();
    });

    it('is deactivated', function () {
      expect(elem.attr('disabled')).toBeTruthy();
    });

    it('creates a transparent button layer', function () {
      expect(container.find('.transparent-button-layer').get(0)).toBeDefined();
    });

    it('creates a transparent button layer', function () {
      expect(tooltipStub.args[0][0]).toEqual({
        title: 'reasons',
        trigger: 'hover'
      });
    });
  });

  /*
  describe('hides the element with an OR condition', function () {
    beforeEach(function () {
      canStub.returns(false);
      compileElement('create, Entry || create, Asset');
    });

    it('has no hide class', function () {
      expect(elem.hasClass('ng-hide')).toBeTruthy();
    });

    it('is deactivated', function () {
      expect(elem.attr('disabled')).toBeFalsy();
    });
  });

  describe('hides the element with an AND condition', function () {
    beforeEach(function () {
      canStub.returns(false);
      compileElement('create, Entry && create, Asset');
    });

    it('has no hide class', function () {
      expect(elem.hasClass('ng-hide')).toBeTruthy();
    });

    it('is deactivated', function () {
      expect(elem.attr('disabled')).toBeFalsy();
    });
  });

  describe('hides the element with a mixed condition', function () {
    beforeEach(function () {
      canStub.returns(false);
      compileElement('create, Entry && create, Asset || update, Asset');
    });

    it('has no hide class', function () {
      expect(elem.hasClass('ng-hide')).toBeTruthy();
    });

    it('is deactivated', function () {
      expect(elem.attr('disabled')).toBeFalsy();
    });
  });
 */

});
