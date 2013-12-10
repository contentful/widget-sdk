'use strict';

describe('The ContentType editor directive', function () {

  var container, scope;
  var compileElement;
  var canStub, reasonsStub;
  var contentTypeData;

  beforeEach(function () {
    canStub = sinon.stub();
    reasonsStub = sinon.stub();
    module('contentful/test', function ($provide) {
      $provide.value('ShareJS', {
        connection: {},
        peek: sinon.stub(),
        mkpath: sinon.stub()
      });
      window.setupCfCanStubs($provide, reasonsStub);
    });
    inject(function ($rootScope, $compile) {
      scope = $rootScope.$new();
      contentTypeData = {};

      scope.can = canStub;
      scope.tab = {
        params: {
          contentType: {
            data: contentTypeData,
            isPublished: sinon.stub(),
            canUnpublish: sinon.stub(),
            canDelete: sinon.stub(),
            getPublishedStatus: sinon.stub(),
            getPublishedVersion: sinon.stub()
          }
        }
      };
      scope.spaceContext = {
        space: {
          getId: sinon.stub()
        }
      };
      scope.validate = sinon.stub();
      scope.publishButtonLabel = sinon.stub();
      scope.otDoc = {
        at: sinon.stub(),
        getAt: sinon.stub(),
        removeListener: sinon.stub(),
        on: sinon.stub(),
        close: sinon.stub()
      };

      compileElement = function () {
        container = $('<div class="content-type-editor" ot-doc-for="tab.params.contentType"></div>');
        $compile(container)(scope);
        scope.$digest();
      };
    });
  });

  afterEach(inject(function ($log) {
    container.remove();
    $log.assertEmpty();
  }));

  it('create button is disabled', function () {
    canStub.withArgs('create', 'ContentType').returns(false);
    reasonsStub.returns(['usageExceeded']);
    compileElement();
    expect(container.find('.add-field-button').attr('disabled')).toBe('disabled');
  });

  it('create button is enabled', function () {
    canStub.withArgs('create', 'ContentType').returns(true);
    compileElement();
    expect(container.find('.add-field-button').attr('disabled')).toBeUndefined();
  });

  describe('sets the otDisabled flag', function () {
    it('to disabled', function () {
      canStub.withArgs('update', contentTypeData).returns(true);
      compileElement();
      expect(scope.otDisabled).toBe(false);
    });

    it('to enabled', function () {
      canStub.withArgs('update', contentTypeData).returns(false);
      compileElement();
      expect(scope.otDisabled).toBe(true);
    });
  });



});
