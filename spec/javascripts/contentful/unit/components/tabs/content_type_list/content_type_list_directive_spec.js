'use strict';

describe('The ContentType list directive', function () {

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
        },
        contentTypes: [],
        refreshContentTypes: sinon.stub()
      };
      scope.tab = {
        params: {}
      };

      container = $('<div class="content-type-list"></div>');
      $compile(container)(scope);
      scope.$digest();
    });
  });

  afterEach(inject(function ($log) {
    $log.assertEmpty();
    container.remove();
  }));

  it('save button is disabled', function () {
    canStub.withArgs('create', 'ContentType').returns(false);
    scope.$apply();
    expect(container.find('.results-empty-advice .primary-button').attr('disabled')).toBe('disabled');
  });

  it('save button is enabled', function () {
    canStub.withArgs('create', 'ContentType').returns(true);
    scope.$apply();
    expect(container.find('.results-empty-advice .primary-button').attr('disabled')).toBeUndefined();
  });

});
