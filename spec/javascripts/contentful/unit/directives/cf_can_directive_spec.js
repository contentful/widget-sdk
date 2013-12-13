'use strict';

describe('The can directive', function () {

  var container, elem, scope;
  var canStub, reasonsStub;
  var enforcementSpy;
  var compileElement;

  beforeEach(function () {
    canStub = sinon.stub();
    reasonsStub = sinon.stub();
    module('contentful/test', function ($provide) {
      window.setupCfCanStubs($provide, reasonsStub);
    });
    inject(function ($rootScope, $compile, enforcements) {
      scope = $rootScope.$new();
      scope.can = canStub;
      enforcementSpy = sinon.spy(enforcements, 'determineEnforcement');

      compileElement = function (expression, extra) {
        container = $('<div><div cf-can="'+expression+'" '+extra+'></div></div>');
        $compile(container)(scope);
        scope.$digest();
        elem = container.find('[cf-can]');
      };
    });
  });

  afterEach(inject(function ($log) {
    enforcementSpy.restore();
    container.remove();
    $('.transparent-button-layer').remove();
    $log.assertEmpty();
  }));


  describe('lets the element be used', function () {
    beforeEach(function () {
      canStub.returns(true);
      reasonsStub.returns(undefined);
      compileElement('create, Entry', 'class="ng-hide" disabled="disabled"');
    });

    it('can is called with supplied condition', function () {
      expect(canStub.args[0]).toEqual(['create', 'Entry']);
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
      reasonsStub.returns(undefined);
      compileElement('create, Entry');
    });

    it('can is called with supplied condition', function () {
      expect(canStub.args[0]).toEqual(['create', 'Entry']);
    });

    it('has a hide class', function () {
      expect(elem.hasClass('ng-hide')).toBeTruthy();
    });

    it('sets a flag on the scope', function () {
      expect(scope.cfCanDisabled).toBeFalsy();
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
      reasonsStub.returns(['usageExceeded']);
      compileElement('create, Entry');
    });

    afterEach(function () {
      tooltipStub.restore();
    });

    it('can is called with supplied condition', function () {
      expect(canStub.args[0]).toEqual(['create', 'Entry']);
    });

    it('has no hide class', function () {
      expect(elem.hasClass('ng-hide')).toBeFalsy();
    });

    it('is deactivated', function () {
      expect(elem.attr('disabled')).toBeTruthy();
    });

    it('sets a flag on the scope', function () {
      expect(scope.cfCanDisabled).toBeTruthy();
    });

    it('enforcement is called with reason', function () {
      expect(enforcementSpy.args[0][0]).toEqual(['usageExceeded']);
    });

    it('enforcement is called with entity type', function () {
      expect(enforcementSpy.args[0][1]).toEqual('Entry');
    });

    it('creates a transparent button layer', function () {
      expect(container.find('.transparent-button-layer').get(0)).toBeDefined();
    });

    it('sets a tooltip on button layer', function () {
      expect(tooltipStub.args[0][0].title).toMatch(/Entries/g);
    });

  });

  describe('hides the element with multiple conditions', function () {
    beforeEach(function () {
      canStub.withArgs('create', 'Entry').returns(true);
      reasonsStub.withArgs('create', 'Entry').returns(undefined);
      canStub.withArgs('create', 'Asset').returns(false);
      reasonsStub.withArgs('create', 'Asset').returns(undefined);
      compileElement('[create, Entry], [create, Asset]');
    });

    it('can is called with supplied condition first time', function () {
      expect(canStub.args[0]).toEqual(['create', 'Entry']);
    });

    it('can is called with supplied condition second time', function () {
      expect(canStub.args[1]).toEqual(['create', 'Asset']);
    });

    it('has no hide class', function () {
      expect(elem.hasClass('ng-hide')).toBeTruthy();
    });

    it('is deactivated', function () {
      expect(elem.attr('disabled')).toBeFalsy();
    });
  });

  describe('disables the element with multiple conditions', function () {
    var tooltipStub;
    beforeEach(function () {
      tooltipStub = sinon.stub($.fn, 'tooltip');
      canStub.withArgs('create', 'Entry').returns(true);
      reasonsStub.withArgs('create', 'Entry').returns(undefined);
      canStub.withArgs('create', 'Asset').returns(false);
      reasonsStub.withArgs('create', 'Asset').returns(['usageExceeded']);
      compileElement('[create, Entry], [create, Asset]');
    });

    afterEach(function () {
      tooltipStub.restore();
    });

    it('can is called with supplied condition first time', function () {
      expect(canStub.args[0]).toEqual(['create', 'Entry']);
    });

    it('can is called with supplied condition second time', function () {
      expect(canStub.args[1]).toEqual(['create', 'Asset']);
    });

    it('has no hide class', function () {
      expect(elem.hasClass('ng-hide')).toBeFalsy();
    });

    it('is deactivated', function () {
      expect(elem.attr('disabled')).toBeTruthy();
    });

    it('enforcement is called with reason', function () {
      expect(enforcementSpy.args[0][0]).toEqual(['usageExceeded']);
    });

    it('enforcement is called with entity type', function () {
      expect(enforcementSpy.args[0][1]).toEqual('Asset');
    });

    it('creates a transparent button layer', function () {
      expect(container.find('.transparent-button-layer').get(0)).toBeDefined();
    });

    it('sets a tooltip on button layer', function () {
      expect(tooltipStub.args[0][0].title).toMatch(/Assets/g);
    });
  });

  describe('override ng-hide cleanup', function () {
    beforeEach(function () {
      canStub.returns(true);
      reasonsStub.returns(undefined);
      compileElement('create, Entry', 'class="ng-hide" ng-init="noCfCanCleanup=true"');
    });

    it('can is called with supplied condition', function () {
      expect(canStub.args[0]).toEqual(['create', 'Entry']);
    });

    it('has no hide class', function () {
      expect(elem.hasClass('ng-hide')).toBeTruthy();
    });

    it('is not deactivated', function () {
      expect(elem.attr('disabled')).toBeFalsy();
    });
  });

  describe('override disabled cleanup', function () {
    beforeEach(function () {
      canStub.returns(true);
      reasonsStub.returns(undefined);
      compileElement('create, Entry', 'disabled="disabled" ng-init="noCfCanCleanup=true"');
    });

    it('can is called with supplied condition', function () {
      expect(canStub.args[0]).toEqual(['create', 'Entry']);
    });

    it('has no hide class', function () {
      expect(elem.hasClass('ng-hide')).toBeFalsy();
    });

    it('is not deactivated', function () {
      expect(elem.attr('disabled')).toBeTruthy();
    });
  });


});
