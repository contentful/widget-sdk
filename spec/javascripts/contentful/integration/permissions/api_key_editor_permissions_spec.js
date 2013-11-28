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
      scope.spaceContext = {
        space: {
          getId: sinon.stub()
        }
      };
      scope.tab = {};
      scope.can = canStub;

      container = $compile('<div class="api-key-editor"></div>')(scope);
      scope.$digest();
    });
  });

  afterEach(inject(function ($log) {
    $log.assertEmpty();
  }));

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
