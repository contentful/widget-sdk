'use strict';

describe('The ApiKey editor permissions', function () {

  var container, scope;
  var canStub;

  beforeEach(function () {
    canStub = sinon.stub();
    module('contentful/test', function ($provide) {
      $provide.value('can', canStub);
    });
    inject(function ($rootScope, $compile) {
      scope = $rootScope.$new();
      scope.tab = {};
      scope.can = canStub;

      container = $('<div class="api-key-editor"></div>');
      $compile(container)(scope);
      scope.$digest();
    });
  });

  afterEach(function () {
    container.remove();
  });

  it('delete button is disabled', function () {
    canStub.withArgs('create', 'ApiKey').returns(false);
    scope.$apply();
    expect(container.find('.tab-actions .delete').attr('disabled')).toBe('disabled');
  });

  it('delete button is enabled', function () {
    canStub.withArgs('create', 'ApiKey').returns(true);
    scope.$apply();
    expect(container.find('.tab-actions .delete').attr('disabled')).toBeUndefined();
  });

  it('save button is disabled', function () {
    scope.apiKeyForm.$invalid = false;
    canStub.withArgs('create', 'ApiKey').returns(false);
    scope.$apply();
    expect(container.find('.tab-actions .save').attr('disabled')).toBe('disabled');
  });

  it('save button is enabled', function () {
    scope.apiKeyForm.$invalid = false;
    canStub.withArgs('create', 'ApiKey').returns(true);
    scope.$apply();
    expect(container.find('.tab-actions .save').attr('disabled')).toBeUndefined();
  });



});
