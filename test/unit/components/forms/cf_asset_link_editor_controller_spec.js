'use strict';

describe('AssetLinkEditorController', function () {
  var linkEditorCtrl, createController;
  var scope, entry, $q, stubs, attrs;
  var shareJSMock, entityCacheMock;

  function validationParser(arg) {
    return arg;
  }

  beforeEach(function () {
    module('contentful/test', function ($provide) {
      stubs = $provide.makeStubs([
        'getEntries',
        'otDocPush',
        'remove',
        'save',
        'getAll'
      ]);

      shareJSMock = {
        peek: sinon.stub(),
        mkpath: sinon.stub()
      };

      entityCacheMock = sinon.stub();
      entityCacheMock.returns({
        save: stubs.save,
        getAll: stubs.getAll
      });

      $provide.value('ShareJS', shareJSMock);
      $provide.value('EntityCache', entityCacheMock);
      $provide.constant('validation', {
        Validation: {
          parse: validationParser
        }
      });
    });

    inject(function ($rootScope, $controller, _$q_, cfStub) {
      $q = _$q_;
      scope = $rootScope.$new();

      var space = cfStub.space('test');
      var contentTypeData = cfStub.contentTypeData('content_type1');
      scope.spaceContext = cfStub.spaceContext(space, [contentTypeData]);
      entry = cfStub.entry(space, 'entry1', 'content_type1');
      scope.spaceContext.space.getEntries = stubs.getEntries;

      scope.field = {
        type: 'Link',
        validations: []
      };

      attrs = {
        ngModel: 'fieldData.value',
        linkMultiple: false
      };

      createController = function () {
        linkEditorCtrl = $controller('AssetLinkEditorController', {
          $scope: scope,
          $attrs: attrs
        });
        scope.$digest();
      };

    });
  });

  describe('initial state', function () {
    beforeEach(function () {
      createController();
    });

    it('links are empty', function () {
      expect(scope.links).toEqual([]);
    });

    it('linkedEntities are empty', function () {
      expect(scope.linkedEntities).toEqual([]);
    });

    it('initializes entity cache', function() {
      sinon.assert.calledWith(entityCacheMock, scope.spaceContext.space, 'getAssets');
    });

    it('initializes link content types', function() {
      expect(scope.linkContentTypes).toBeFalsy();
    });

    it('initializes link mimetype group', function() {
      expect(scope.linkMimetypeGroup).toBeFalsy();
    });

  });

  describe('no validations defined', function () {
    beforeEach(function () {
      createController();
    });

    it('sets no linkContentTypes', function () {
      expect(scope.linkContentTypes).toBeFalsy();
    });

    it('sets no linkMimeTypeGroup', function () {
      expect(scope.linkMimetypeGroup).toBeFalsy();
    });
  });

  describe('validations are defined', function () {
    beforeEach(function () {
      scope.field.validations = [
        {name: 'linkMimetypeGroup', mimetypeGroupName: 'file'}
      ];
      createController();
    });

    it('sets linkMimetypeGroup to type defined in validation', function () {
      expect(scope.linkMimetypeGroup).toBe('file');
    });
  });

});
