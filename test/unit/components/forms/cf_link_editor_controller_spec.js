'use strict';

describe('LinkEditorController', function () {
  var createController;
  var scope, entry, $q, stubs;
  var shareJSMock, entityCacheMock, linkParams;

  afterEach(function () {
    createController =
      scope = entry = $q = stubs =
      shareJSMock = entityCacheMock = linkParams = null;
  });

  function validationParser (arg) {
    return arg;
  }

  beforeEach(function () {
    module('contentful/test', function ($provide) {
      stubs = $provide.makeStubs([
        'otDocPush',
        'remove',
        'save',
        'getAll',
        'setValidationType'
      ]);

      shareJSMock = {
        peek: sinon.stub(),
        mkpathAndSetValue: sinon.stub()
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

      scope.field = {
        type: 'Link',
        validations: []
      };

      linkParams = {
        type: 'Entry',
        fetchMethod: 'getEntries',
        multiple: false
      };

      createController = function () {
        $controller('LinkEditorController', {
          $scope: scope,
          ngModel: 'fieldData.value',
          linkParams: linkParams,
          setValidationType: stubs.setValidationType
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

    it('initializes entity cache', function () {
      sinon.assert.calledWith(entityCacheMock, scope.spaceContext.space, 'getEntries');
    });

  });

  describe('methods', function () {

    beforeEach(function () {
      linkParams.type = 'Entry';

      scope.fieldData = {value: 'formfieldvalue'};
      scope.field = {
        type: 'Link',
        validations: []
      };

      this.changeValueDeferred = $q.defer();
      scope.otSubDoc = {
        changeValue: sinon.stub().returns(this.changeValueDeferred.promise)
      };
      scope.updateModel = sinon.stub();

      scope.otDoc = {
        doc: {
          at: sinon.stub()
        }
      };
      scope.otDoc.doc.at.returns({
        push: stubs.otDocPush,
        remove: stubs.remove
      });
      scope.otPath = [];
    });

    describe('attaches a list of previously loaded entries', function () {
      beforeEach(function () {
        createController();
        stubs.getAll.returns($q.resolve([entry, undefined]));
        scope.links = [
          { sys: { id: 'entry1', linkType: 'Entry', type: 'Link' } },
          { sys: { id: 'entry2', linkType: 'Entry', type: 'Link' } }
        ];
        scope.$apply();
      });

      it('has linked entities', function () {
        expect(scope.linkedEntities.length).toBe(2);
      });

      it('one of the entities is missing', function () {
        expect(scope.linkedEntities[1].isMissing).toBeTruthy();
      });
    });
  });

  describe('setValidation', function () {
    it('is called with initial validation', function () {
      var validation = {linkContentType: ['ct-id']};
      scope.field.validations.push(validation);
      createController();
      sinon.assert.calledWith(stubs.setValidationType, validation);
    });

    it('is called with initial item validation', function () {
      var validation = {linkContentType: ['ct-id']};
      scope.field.type = 'Array';
      scope.field.items = {validations: [validation]};
      createController();
      sinon.assert.calledWith(stubs.setValidationType, validation);
    });

    it('is called when validation changes', function () {
      scope.field.validations = [{linkContentType: ['ct-id']}];
      createController();
      sinon.assert.calledWith(stubs.setValidationType,
                              {linkContentType: ['ct-id']});

      scope.field.validations[0] = {linkContentType: ['another-ct-id']};
      scope.$apply();
      sinon.assert.calledWith(stubs.setValidationType,
                              {linkContentType: ['another-ct-id']});
    });

    it('is called when validation is removed', function () {
      scope.field.validations = [{linkContentType: ['ct-id']}];
      createController();

      scope.field.validations.pop();
      scope.$apply();
      var undef;
      sinon.assert.calledWith(stubs.setValidationType, undef);
    });
  });


  /**
   * This tests for the private method removeValue() which should always call
   * $scope.otSubDoc.changeValue() with undefined and never null when removing
   * links. In order to test removeValue() we need to call $scope.removeLink()
   * and pass through both code paths that call removeValue(). To test both
   * paths these conditions need to be met:
   * a) $scope.linkSingle is true
   * or
   * b) $scope.linkSingle is false and the link being removed is the last link
   *
   * See BUG#6696
   */
  describe('ensures that $scope.removeLink() never uses null', function () {
    beforeEach(function () {
      createController();
      scope.otSubDoc = {
        changeValue: sinon.stub().returns($q.defer().promise)
      };
    });

    it('is called when removing a link and linkSingle=true',
    function () {
      scope.linkSingle = true;
      scope.links = [
        {sys: {id: 'entry1'}},
        {sys: {id: 'entry2'}}
      ];
      scope.removeLink();
      sinon.assert.calledWith(scope.otSubDoc.changeValue, undefined);
    });

    it('is called when linkSingle=false and we\'re removing the last link ',
    function () {
      scope.linkSingle = false;
      scope.links = [
        {sys: {id: 'entry1'}}
      ];
      scope.removeLink();
      sinon.assert.calledWith(scope.otSubDoc.changeValue, undefined);
    });
  });

});
