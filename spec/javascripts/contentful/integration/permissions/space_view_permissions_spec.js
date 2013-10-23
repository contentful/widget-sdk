'use strict';

describe('The Space view permissions', function () {

  var container, scope;
  var canStub;

  beforeEach(function () {
    canStub = sinon.stub();
    module('contentful/test', function ($provide) {
      $provide.value('can', canStub);
    });
    inject(function ($rootScope, $compile) {
      scope = $rootScope.$new();
      scope.spaceContext = {
        space: {}
      };

      container = $('<space-view></space-view>');
      $compile(container)(scope);
      scope.$digest();
    });
  });

  afterEach(function () {
    container.remove();
  });

  it('add button not shown if no create permissions exist', function () {
    canStub.returns(false);
    scope.$apply();
    expect(container.find('.tablist-button').hasClass('ng-hide')).toBe(true);
  });

  it('add button shown if user can create a content type', function () {
    canStub.withArgs('create', 'ContentType').returns(true);
    scope.$apply();
    expect(container.find('.tablist-button').hasClass('ng-hide')).toBe(false);
  });

  it('add button shown if user can create an entry', function () {
    canStub.withArgs('create', 'Entry').returns(true);
    scope.$apply();
    expect(container.find('.tablist-button').hasClass('ng-hide')).toBe(false);
  });

  it('add button shown if user can create an asset', function () {
    canStub.withArgs('create', 'Asset').returns(true);
    scope.$apply();
    expect(container.find('.tablist-button').hasClass('ng-hide')).toBe(false);
  });

  it('add button shown if user can create an apikey', function () {
    canStub.withArgs('create', 'ApiKey').returns(true);
    scope.$apply();
    expect(container.find('.tablist-button').hasClass('ng-hide')).toBe(false);
  });

});
