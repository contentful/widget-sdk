'use strict';

describe('The ContentType editor directive', function () {

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
      scope.tab = {
        params: {
          contentType: {
            data: {},
            isPublished: sinon.stub(),
            canUnpublish: sinon.stub(),
            canDelete: sinon.stub(),
            getPublishedStatus: sinon.stub()
          }
        }
      };
      scope.spaceContext = {
        space: {
          getId: sinon.stub()
        }
      };
      scope.validate = sinon.stub();

      container = $('<div class="content-type-editor" ot-doc-for="tab.params.contentType"></div>');
      $compile(container)(scope);
      scope.$digest();
    });
  });

  afterEach(inject(function ($log) {
    container.remove();
    $log.assertEmpty();
  }));

  it('create button is disabled', function () {
    canStub.withArgs('create', 'ContentType').returns(false);
    scope.$apply();
    expect(container.find('.add-field-button').attr('disabled')).toBe('disabled');
  });

  it('create button is enabled', function () {
    canStub.withArgs('create', 'ContentType').returns(true);
    scope.$apply();
    expect(container.find('.add-field-button').attr('disabled')).toBeUndefined();
  });

  describe('sets the otDisabled flag', function () {
    it('to disabled', function () {
      canStub.withArgs('update', scope.contentType.data).returns(true);
      scope.$apply();
      expect(scope.otDisabled).toBe(false);
    });

    it('to enabled', function () {
      canStub.withArgs('update', scope.contentType.data).returns(false);
      scope.$apply();
      expect(scope.otDisabled).toBe(true);
    });
  });



});
