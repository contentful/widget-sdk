'use strict';

describe('EntryLinkEditorController', function () {
  var linkEditorCtrl, createController;
  var scope, entry, $q, stubs, attrs;
  var shareJSMock, linkEditorCacheMock;

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

      linkEditorCacheMock = sinon.stub();
      linkEditorCacheMock.returns({
        save: stubs.save,
        getAll: stubs.getAll
      });

      $provide.value('ShareJS', shareJSMock);
      $provide.value('LinkEditorEntityCache', linkEditorCacheMock);
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
        linkEditorCtrl = $controller('EntryLinkEditorController', {
          $scope: scope,
          $attrs: attrs
        });
        scope.$digest();
      };

    });
  });

  afterEach(inject(function ($log) {
    $log.assertEmpty();
  }));

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
      expect(linkEditorCacheMock).toBeCalledWith(scope.spaceContext.space, 'getEntries');
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
        expect(scope.updateModel).toBeCalled();
      });

      it('does not get entries', function() {
        expect(stubs.getEntries).not.toBeCalled();
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

      scope.otChangeValue = sinon.stub();
      scope.updateModel = sinon.stub();

      scope.otDoc = {
        at: sinon.stub()
      };
      scope.otDoc.at.returns({
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
          scope.otChangeValue.yield();
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
          scope.otChangeValue.yield();
          scope.$apply();
        });

        it('updates model', function() {
          expect(scope.updateModel).toBeCalled();
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
          shareJSMock.mkpath.yield();
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
          expect(scope.updateModel).toBeCalled();
        });

        it('removes link', function() {
          scope.removeLink(0, entry);
          stubs.remove.yield();
          expect(scope.links.length).toBe(0);
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

});
