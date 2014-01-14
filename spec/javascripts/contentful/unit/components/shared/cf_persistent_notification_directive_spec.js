'use strict';

describe('cfPersistentNotification Directive', function () {
  var element, scope;
  var tooltipStub;
  var $rootScope;
  beforeEach(module('contentful/test'));

  beforeEach(inject(function ($compile, _$rootScope_) {
    $rootScope = _$rootScope_;
    scope = $rootScope.$new();
    scope.field = {};
    element = $compile('<div class="cf-persistent-notification"></div>')(scope);
  }));

  afterEach(inject(function ($log) {
    $log.assertEmpty();
  }));

  it('should show message', function () {
    $rootScope.$broadcast('persistentNotification', {
      message: 'some message'
    });
    scope.$apply();
    expect(element.find('p')).not.toBeNgHidden();
  });

  it('should not show message', function () {
    $rootScope.$broadcast('persistentNotification');
    scope.$apply();
    expect(element.find('p')).toBeNgHidden();
  });

  it('should show action message', function () {
    $rootScope.$broadcast('persistentNotification', {
      actionMessage: 'some message'
    });
    scope.$apply();
    expect(element.find('button')).not.toBeNgHidden();
  });

  it('should not show action message', function () {
    $rootScope.$broadcast('persistentNotification');
    scope.$apply();
    expect(element.find('button')).toBeNgHidden();
  });

  it('should have tooltip', function () {
    tooltipStub = sinon.stub($.fn, 'tooltip');
    $rootScope.$broadcast('persistentNotification', {
      tooltipMessage: 'some message'
    });

    scope.$apply();
    expect(tooltipStub).toBeCalled();
    tooltipStub.restore();
  });



});
