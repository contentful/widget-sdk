'use strict';

describe('cfPersistentNotification Directve', function () {
  var element, scope;
  var tooltipStub;
  beforeEach(module('contentful/test'));

  beforeEach(inject(function ($compile, $rootScope) {
    scope = $rootScope;
    scope.field = {};
    element = $compile('<div class="cf-persistent-notification"></div>')(scope);
  }));

  afterEach(inject(function ($log) {
    $log.assertEmpty();
  }));

  it('should show message', function () {
    scope.persistentNotification = {
      message: 'some message'
    };
    scope.$apply();
    expect(element.find('p').hasClass('ng-hide')).toBe(false);
  });

  it('should not show message', function () {
    scope.persistentNotification = {
    };
    scope.$apply();
    expect(element.find('p').hasClass('ng-hide')).toBe(true);
  });

  it('should show action message', function () {
    scope.persistentNotification = {
      actionMessage: 'some message'
    };
    scope.$apply();
    expect(element.find('button').hasClass('ng-hide')).toBe(false);
  });

  it('should not show action message', function () {
    scope.persistentNotification = {
    };
    scope.$apply();
    expect(element.find('button').hasClass('ng-hide')).toBe(true);
  });

  it('should have tooltip', function () {
    scope.persistentNotification = {
      tooltipMessage: 'some message'
    };
    tooltipStub = sinon.stub($.fn, 'tooltip');

    scope.$apply();
    expect(tooltipStub.called).toBe(true);
    tooltipStub.restore();
  });



});
