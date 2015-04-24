'use strict';

describe('cfPersistentNotification Directive', function () {
  var element, scope;
  var $rootScope;
  beforeEach(module('contentful/test'));

  beforeEach(inject(function ($compile, _$rootScope_) {
    $rootScope = _$rootScope_;
    scope = $rootScope.$new();
    scope.field = {};
    element = $compile('<cf-persistent-notification></cf-persistent-notification>')(scope);
  }));

  it('should show message', function () {
    $rootScope.$broadcast('persistentNotification', {
      message: 'some message'
    });
    scope.$digest();
    expect(element.find('span')).not.toBeNgHidden();
  });

  it('should not show message', function () {
    $rootScope.$broadcast('persistentNotification');
    scope.$digest();
    expect(element.find('span')).toBeNgHidden();
  });

  it('should show action message', function () {
    $rootScope.$broadcast('persistentNotification', {
      actionMessage: 'some message'
    });
    scope.$digest();
    expect(element.find('button')).not.toBeNgHidden();
  });

  it('should not show action message', function () {
    $rootScope.$broadcast('persistentNotification');
    scope.$digest();
    expect(element.find('button')).toBeNgHidden();
  });

});
