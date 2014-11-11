'use strict';

describe('cfLinkEditor Controller', function () {
  var linkEditorCtrl, createController;
  var scope, entry, $q, stubs;
  var shareJSMock, entityCacheMock, linkParams;

  function validationParser(arg) {
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
        linkEditorCtrl = $controller('LinkEditorController', {
          $scope: scope,
          ngModel: 'fieldData.value',
          linkParams: linkParams,
          setValidationType: stubs.setValidationType
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
      expect(entityCacheMock).toBeCalledWith(scope.spaceContext.space, 'getEntries');
    });

    it('initializes link content types', function() {
      expect(scope.linkContentTypes).toBeFalsy();
    });

    it('initializes link mimetype group', function() {
      expect(scope.linkMimetypeGroup).toBeFalsy();
    });

  });

  describe('methods', function() {
    function addEntryExpectations() {
      it('updates model', function() {
        expect(scope.updateModel).toBeCalled();
      });

      it('link is the supplied entry', function() {
        expect(scope.links[0].sys.id).toEqual('entry1');
      });

      it('linked entities length is 1', function() {
        expect(scope.linkedEntities.length).toBe(1);
      });
    }

    beforeEach(function() {
      linkParams.type = 'Entry';

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
        linkParams.multiple = false;
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
        linkParams.multiple = true;
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
