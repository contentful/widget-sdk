'use strict';

describe('The ApiKey list directive', function () {

  var container, scope;
  var canStub;

  beforeEach(function () {
    canStub = sinon.stub();
    module('contentful/test', function ($provide) {
      $provide.value('can', canStub);
    });
    inject(function ($rootScope, $compile) {
      scope = $rootScope.$new();
      scope.can = canStub;
      scope.spaceContext = {
        space: {
          getApiKeys: sinon.stub()
        }
      };

      container = $('<div class="api-key-list"></div>');
      $compile(container)(scope);
      scope.$digest();
    });
  });

  afterEach(inject(function ($log) {
    $log.assertEmpty();
    container.remove();
  }));

  it('save button is disabled', function () {
    canStub.withArgs('create', 'ApiKey').returns(false);
    scope.$apply();
    expect(container.find('.create-api-key-advice button').attr('disabled')).toBe('disabled');
  });

  it('save button is enabled', function () {
    canStub.withArgs('create', 'ApiKey').returns(true);
    scope.$apply();
    expect(container.find('.create-api-key-advice button').attr('disabled')).toBeUndefined();
  });



});
