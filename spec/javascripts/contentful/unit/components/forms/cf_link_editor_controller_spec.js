'use strict';

describe('cfLinkEditor Controller', function () {
  var cfLinkEditorCtrl, createController;
  var scope, attrs, entry, $q;
  var shareJSMock;
  var validationParseStub;

  function validationParser(arg) {
    return arg;
  }

  beforeEach(function () {
    module('contentful/test', function ($provide) {
      shareJSMock = {
        peek: sinon.stub(),
        mkpath: sinon.stub()
      };

      $provide.value('ShareJS', shareJSMock);
    });
    inject(function ($rootScope, $controller, _$q_, cfStub, validation) {
      $q = _$q_;
      scope = $rootScope.$new();

      validationParseStub = sinon.stub(validation.Validation, 'parse', validationParser);

      attrs = {ngModel: 'fieldData.value'};
      var space = cfStub.space('test');
      var contentTypeData = cfStub.contentTypeData('content_type1');
      scope.spaceContext = cfStub.spaceContext(space, [contentTypeData]);
      entry = cfStub.entry(space, 'entry1', 'content_type1');

      scope.field = {
        type: 'Link',
        validations: []
      };
      scope.linkType = 'Entry';

      createController = function () {
        cfLinkEditorCtrl = $controller('cfLinkEditorCtrl', {
          $scope: scope,
          $attrs: attrs,
        });
        scope.$apply();
      };

    });
  });

  afterEach(inject(function ($log) {
    validationParseStub.restore();
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
  });

  describe('linkType is Entry', function () {

    describe('no validations defined', function () {
      beforeEach(function () {
        scope.linkType = 'Entry';
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
        scope.$apply();
      });

      it('sets linkContentType to type defined in validation', function () {
        expect(scope.linkContentTypes[0].getId()).toBe('content_type1');
      });
    });
  });

  describe('linkType is Asset', function () {

    describe('no validations defined', function () {
      beforeEach(function () {
        scope.linkType = 'Asset';
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
        scope.linkType = 'Asset';
        scope.field.validations = [
          {name: 'linkMimetypeGroup', mimetypeGroupName: 'file'}
        ];
        createController();
        scope.$apply();
      });

      it('sets linkMimetypeGroup to type defined in validation', function () {
        expect(scope.linkMimetypeGroup).toBe('file');
      });
    });

  });
});

describe('cfLinkEditor Controller methods', function () {
  var scope, attrs, $q;
  var getEntriesStub, otDocPushStub, removeStub, shareJSMock;
  var cfLinkEditorCtrl;
  var entry;

  beforeEach(function () {
    module('contentful/test', function ($provide) {
      shareJSMock = {
        peek: sinon.stub(),
        mkpath: sinon.stub()
      };

      $provide.value('ShareJS', shareJSMock);
    });
    inject(function ($rootScope, $controller, _$q_, cfStub) {
      $q = _$q_;
      scope = $rootScope.$new();

      scope.fetchMethod = 'getEntries';
      scope.fieldData = {value: 'formfieldvalue'};
      scope.field = {
        type: 'Link',
        validations: []
      };
      scope.otChangeValue = sinon.stub();
      scope.updateModel = sinon.stub();
      scope.linkType = 'Entry';

      getEntriesStub = sinon.stub();
      scope.spaceContext = {
        space: {
          getEntries : getEntriesStub
        }
      };

      scope.otDoc = {
        at: sinon.stub()
      };
      otDocPushStub = sinon.stub();
      removeStub = sinon.stub();
      scope.otDoc.at.returns({
        push: otDocPushStub,
        remove: removeStub
      });

      scope.otPath = [];

      attrs = {ngModel: 'fieldData.value'};

      var space = cfStub.space('test');
      entry = cfStub.entry(space, 'entry1', 'content_type1');

      cfLinkEditorCtrl = $controller('cfLinkEditorCtrl', {
        $scope: scope,
        $attrs: attrs,
      });
      scope.$apply();
    });
  });

  afterEach(inject(function ($log) {
    $log.assertEmpty();
  }));


  describe('in single entry mode', function () {
    beforeEach(function () {
      attrs.cfLinkEditor = 'entry';
      scope.linkSingle = true;
    });

    it('add an entry', function () {
      scope.addLink(entry);
      scope.otChangeValue.yield();
      scope.$apply();
      expect(scope.links.length).toBe(1);
      expect(scope.updateModel).toBeCalled();
      expect(getEntriesStub).not.toBeCalled();
      expect(scope.links[0].sys.id).toEqual('entry1');
      expect(scope.linkedEntities.length).toBe(1);
    });

    it('removes an entry', function () {
        scope.links = [
          {sys: {id: 'entry1'}},
          {sys: {id: 'entry2'}},
          {sys: {id: 'entry3'}}
        ];
        scope.removeLink(0, entry);
        scope.otChangeValue.yield();
        scope.$apply();
        expect(scope.updateModel).toBeCalled();
        expect(scope.links.length).toBe(0);
    });
  });

  describe('in multiple entry mode', function () {
    it('add an entry to an existing list', function () {
      shareJSMock.peek.returns([]);

      scope.addLink(entry);
      otDocPushStub.yield();

      expect(scope.updateModel).toBeCalled();
      expect(getEntriesStub).not.toBeCalled();
      expect(scope.links[0].sys.id).toEqual('entry1');
      expect(scope.linkedEntities.length).toBe(1);
    });

    it('add an entry to a nonexisting list', function () {
      shareJSMock.peek.returns({});

      scope.addLink(entry);
      shareJSMock.mkpath.yield();

      expect(scope.updateModel).toBeCalled();
      expect(getEntriesStub).not.toBeCalled();
      expect(scope.links[0].sys.id).toEqual('entry1');
      expect(scope.linkedEntities.length).toBe(1);
    });

    it('removes an entry from a list', function () {
      shareJSMock.peek.returns([]);

      scope.addLink(entry);
      otDocPushStub.yield();

      expect(scope.updateModel).toBeCalled();
      scope.removeLink(0, entry);
      removeStub.yield();
      expect(scope.links.length).toBe(0);
    });
  });

  describe('attaches a list of previously loaded entries', function () {
    it('and fetches them for caching', function () {
      scope.links = [
        { sys: { id: 'entry1', linkType: 'Entry', type: 'Link' } },
        { sys: { id: 'entry2', linkType: 'Entry', type: 'Link' } }
      ];
      getEntriesStub.returns($q.when([entry, undefined]));
      scope.$apply();
      expect(getEntriesStub).toBeCalledWith({
        'sys.id[in]': 'entry1,entry2',
        limit: 1000
      });
      scope.$apply();
      expect(scope.linkedEntities.length).toBe(2);
      expect(scope.linkedEntities[1].isMissing).toBeTruthy();
    });
  });

});
