'use strict';

describe('EntryLinkEditorController', function () {
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
        'getAll',
        'entryTitle',
        'publishedTypeForEntry',
        'localizedField'
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
      scope.spaceContext.space.getEntries = stubs.getEntries;
      scope.spaceContext.entryTitle = stubs.entryTitle;
      scope.spaceContext.localizedField = stubs.localizedField;
      scope.spaceContext.publishedTypeForEntry = stubs.publishedTypeForEntry;

      scope.locale = {
        code: 'en-US',
        internal_code: 'en-US'
      };

      scope.field = {
        type: 'Link',
        validations: []
      };

      attrs = {
        ngModel: 'fieldData.value',
        linkMultiple: false
      };

      createController = function () {
        linkEditorCtrl = $controller('EntryLinkEditorController', {
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
      sinon.assert.calledWith(entityCacheMock, scope.spaceContext.space, 'getEntries');
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

    it('sets no linkMimetypeGroup', function () {
      expect(scope.linkMimetypeGroup).toBeFalsy();
    });
  });

  describe('validations are defined', function () {
    beforeEach(function () {
      scope.field.validations = [
        {name: 'linkContentType', contentTypeId: ['content_type1']}
      ];
      createController();
    });

    it('sets linkContentType to type defined in validation', function () {
      expect(scope.linkContentTypes[0].getId()).toBe('content_type1');
    });
  });

  describe('methods', function() {
    function addEntryExpectations() {
      it('updates model', function() {
        sinon.assert.called(scope.updateModel);
      });

      it('does not get entries', function() {
        sinon.assert.notCalled(stubs.getEntries);
      });

      it('link is the supplied entry', function() {
        expect(scope.links[0].sys.id).toEqual('entry1');
      });

      it('linked entities length is 1', function() {
        expect(scope.linkedEntities.length).toBe(1);
      });
    }

    beforeEach(function() {
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

    describe('in single entry mode', function () {
      beforeEach(function () {
        attrs.linkMultiple = false;
        stubs.getAll.returns($q.when([entry]));
        createController();
      });

      describe('add an entry', function () {
        beforeEach(function() {
          scope.addLink(entry);
          this.changeValueDeferred.resolve();
          scope.$apply();
        });

        it('has one link', function() {
          expect(scope.links.length).toBe(1);
        });

        addEntryExpectations();
      });

      describe('removes an entry', function () {
        beforeEach(function() {
          scope.links = [
            {sys: {id: 'entry1'}},
            {sys: {id: 'entry2'}},
            {sys: {id: 'entry3'}}
          ];
          scope.removeLink(0, entry);
          this.changeValueDeferred.resolve();
          scope.$apply();
        });

        it('updates model', function() {
          sinon.assert.called(scope.updateModel);
        });

        it('has 0 links', function() {
          expect(scope.links.length).toBe(0);
        });
      });
    });

    describe('in multiple entry mode', function () {
      beforeEach(function () {
        attrs.linkMultiple = true;
        stubs.getAll.returns($q.when([entry]));
        createController();
      });

      describe('add an entry to an existing list', function () {
        beforeEach(function() {
          shareJSMock.peek.returns([]);

          scope.addLink(entry);
          stubs.otDocPush.yield();
        });

        addEntryExpectations();
      });

      describe('add an entry to a nonexisting list', function () {
        beforeEach(function() {
          shareJSMock.peek.returns({});

          scope.addLink(entry);
          shareJSMock.mkpathAndSetValue.yield();
        });

        addEntryExpectations();
      });

      describe('removes an entry from a list', function () {
        beforeEach(function() {
          shareJSMock.peek.returns([]);

          scope.addLink(entry);
          stubs.otDocPush.yield();
        });

        it('updates model', function() {
          sinon.assert.called(scope.updateModel);
        });

        it('removes link', function() {
          scope.removeLink(0, entry);
          this.changeValueDeferred.resolve();
          scope.$apply();
          expect(scope.links).toEqual([]);
        });
      });
    });

    describe('attaches a list of previously loaded entries', function () {
      beforeEach(function() {
        createController();
        stubs.getAll.returns($q.when([entry, undefined]));
        scope.links = [
          { sys: { id: 'entry1', linkType: 'Entry', type: 'Link' } },
          { sys: { id: 'entry2', linkType: 'Entry', type: 'Link' } }
        ];
        scope.$apply();
      });

      it('has linked entities', function() {
        expect(scope.linkedEntities.length).toBe(2);
      });

      it('one of the entities is missing', function() {
        expect(scope.linkedEntities[1].isMissing).toBeTruthy();
      });
    });

  });

  describe('link title', function() {
    var entity, title;
    beforeEach(function() {
      entity = {
        getId: sinon.stub()
      };
      createController();
    });

    describe('for existing entity', function() {
      beforeEach(function() {
        entity.getId.returns('123');
        stubs.entryTitle.returns('entry title');
        title = linkEditorCtrl.linkTitle(entity);
      });

      it('gets existing title', function() {
        sinon.assert.calledWith(stubs.entryTitle, entity, 'en-US');
      });

      it('returns existing title', function() {
        expect(title).toBe('entry title');
      });
    });

    describe('for non existing entity', function() {
      beforeEach(function() {
        entity.isMissing = true;
        title = linkEditorCtrl.linkTitle(entity);
      });

      it('does not get existing title', function() {
        sinon.assert.notCalled(stubs.entryTitle);
      });

      it('returns missing title', function() {
        expect(title).toMatch('Missing entity');
      });
    });
  });

  describe('link description', function() {
    var entity, description;
    beforeEach(function() {
      entity = {
        getId: sinon.stub()
      };
      createController();
    });

    describe('for existing entity', function() {
      beforeEach(function() {
        entity.getId.returns('123');
      });

      describe('if an eligible description field is found', function() {
        beforeEach(function() {
          stubs.publishedTypeForEntry.returns({
            data: {
              displayField: 'displayme',
              fields: [
                {id: 'displayme', type: 'Text'},
                {id: 'description', type: 'Text'},
              ]
            }
          });
          stubs.localizedField.returns('description text');
          description = linkEditorCtrl.linkDescription(entity);
        });

        it('gets existing description', function() {
          sinon.assert.calledWith(stubs.localizedField, entity, 'data.fields.description');
        });

        it('returns existing description', function() {
          expect(description).toBe('description text');
        });
      });

      describe('if no eligible description field is found', function() {
        beforeEach(function() {
          stubs.publishedTypeForEntry.returns({
            data: {
              displayField: 'displayme',
              fields: [
                {id: 'displayme', type: 'Text'},
              ]
            }
          });
          description = linkEditorCtrl.linkDescription(entity);
        });

        it('does not get existing description', function() {
          sinon.assert.notCalled(stubs.localizedField);
        });

        it('returns missing description', function() {
          expect(description).toBeNull();
        });
      });
    });

    describe('for non existing entity', function() {
      beforeEach(function() {
        entity.isMissing = true;
        description = linkEditorCtrl.linkDescription(entity);
      });

      it('does not get existing description', function() {
        sinon.assert.notCalled(stubs.localizedField);
      });

      it('returns missing description', function() {
        expect(description).toBeNull();
      });
    });
  });

});
