'use strict';

describe('AssetLinkEditorController', function () {
  var createController;
  var scope;
  var entityCacheMock;

  afterEach(function () {
    createController =
      scope =
      entityCacheMock = null;
  });

  beforeEach(function () {
    module('contentful/test', function ($provide) {

      entityCacheMock = sinon.stub();
      entityCacheMock.returns({
        save: sinon.stub(),
        getAll: sinon.stub()
      });

      $provide.value('EntityCache', entityCacheMock);
    });

    scope = this.$inject('$rootScope').$new();

    var cfStub = this.$inject('cfStub');
    var space = cfStub.space('test');
    var contentTypeData = cfStub.contentTypeData('content_type1');
    scope.spaceContext = cfStub.spaceContext(space, [contentTypeData]);

    scope.field = {
      type: 'Link',
      validations: []
    };

    scope.otSubDoc = {
      onValueChanged: sinon.stub().returns(_.noop)
    };

    var attrs = {
      ngModel: 'fieldData.value',
      linkMultiple: false
    };

    var $controller = this.$inject('$controller');
    createController = function () {
      $controller('AssetLinkEditorController', {
        $scope: scope,
        $attrs: attrs
      });
      scope.$digest();
    };
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

    it('initializes entity cache', function () {
      sinon.assert.calledWith(entityCacheMock, scope.spaceContext.space, 'getAssets');
    });

    it('initializes link content types', function () {
      expect(scope.linkContentTypes).toBeFalsy();
    });

    it('initializes link mimetype group', function () {
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
        {linkMimetypeGroup: 'file'}
      ];
      createController();
    });

    it('sets linkMimetypeGroup to type defined in validation', function () {
      expect(scope.linkMimetypeGroup).toEqual(['file']);
    });
  });

});
