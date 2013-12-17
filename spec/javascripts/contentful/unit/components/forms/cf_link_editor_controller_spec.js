'use strict';

describe('cfLinkEditor Controller', function () {
  var cfLinkEditorCtrl, createController;
  var scope, attrs, entry, $q;
  var getEntriesStub, otDocPushStub, removeStub, shareJSMock;
  var validationParseStub;

  function validationParser(arg) {
    return arg;
  }

  beforeEach(function () {
    module('contentful/test');
    inject(function ($rootScope, $controller, $parse, _$q_, cfStub, validation) {
      $q = _$q_;
      scope = $rootScope.$new();

      validationParseStub = sinon.stub(validation.Validation, 'parse', validationParser);

      attrs = {ngModel: 'fieldData.value'};
      shareJSMock = {
        peek: sinon.stub(),
        mkpath: sinon.stub()
      };

      var space = cfStub.space('test');
      var contentTypeData = cfStub.contentTypeData('content_type1');
      scope.spaceContext = cfStub.spaceContext(space, [contentTypeData]);
      entry = cfStub.entry(space, 'entry1', 'content_type1');

      scope.field = {
        type: 'Link',
        validations: []
      };

      createController = function () {
        cfLinkEditorCtrl = $controller('cfLinkEditorCtrl', {
          $scope: scope,
          $parse: $parse,
          $attrs: attrs,
          ShareJS: shareJSMock
        });
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

      it('sets no linkContentType', function () {
        expect(scope.linkContentType).toBeUndefined();
      });

      it('sets no linkContentType', function () {
        expect(scope.linkMimetypeGroup).toBeUndefined();
      });
    });

    describe('validations are defined', function () {
      beforeEach(function () {
        scope.linkType = '';
        scope.field.validations = [
          {name: 'linkContentType', contentTypeId: 'content_type1'}
        ];
        createController();
        scope.linkType = 'Entry';
        scope.$digest();
      });

      it('sets linkContentType to type defined in validation', function () {
        expect(scope.linkContentType.getId()).toBe('content_type1');
      });
    });
  });

  describe('linkType is Asset', function () {

    describe('no validations defined', function () {
      beforeEach(function () {
        scope.linkType = 'Asset';
        createController();
      });

      it('sets no linkContentType', function () {
        expect(scope.linkContentType).toBeUndefined();
      });

      it('sets no linkContentType', function () {
        expect(scope.linkMimetypeGroup).toBeUndefined();
      });
    });

    describe('validations are defined', function () {
      beforeEach(function () {
        scope.linkType = '';
        scope.field.validations = [
          {name: 'linkMimetypeGroup', mimetypeGroupName: 'file'}
        ];
        createController();
        scope.linkType = 'Asset';
        scope.$digest();
      });

      it('sets linkMimetypeGroup to type defined in validation', function () {
        expect(scope.linkMimetypeGroup).toBe('file');
      });
    });

  });
});

// TODO these tests could do with a coverage check 
describe('cfLinkEditor Controller methods', function () {
  var scope, attrs, $q;
  var getEntriesStub, otDocPushStub, removeStub, shareJSMock;
  var cfLinkEditorCtrl;
  var entry;

  // A spy around a function that resolves the provided deferred in the next tick
  function makeCallbackSpy(deferred){
    return sinon.spy(function () {
      _.defer(function () {
        scope.$apply(function () {
          deferred.resolve();
        });
      });
    });
  }

  // A deferred that resolves when the linkedEntities have changed
  function makeLinkedEntitiesDeferred() {
    var deferred = $q.defer();
    scope.$watch('linkedEntities', function () {
      deferred.resolve();
    });
    return deferred;
  }

  beforeEach(function () {
    module('contentful/test');
    inject(function ($rootScope, $controller, $parse, _$q_, cfStub) {
      $q = _$q_;
      scope = $rootScope.$new();

      scope.fieldData = {value: 'formfieldvalue'};
      scope.field = {
        type: 'Link',
        validations: []
      };
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

      shareJSMock = {
        peek: sinon.stub(),
        mkpath: sinon.stub()
      };

      attrs = {ngModel: 'fieldData.value'};

      var space = cfStub.space('test');
      entry = cfStub.entry(space, 'entry1', 'content_type1');

      cfLinkEditorCtrl = $controller('cfLinkEditorCtrl', {
        $scope: scope,
        $parse: $parse,
        $attrs: attrs,
        ShareJS: shareJSMock
      });
    });
  });

  afterEach(inject(function ($log) {
    $log.assertEmpty();
  }));


  describe('attaches one entry to an entry directive', function () {
    var callbackSpy;
    beforeEach(function () {
      attrs.cfLinkEditor = 'entry';
      scope.otChangeValue = sinon.stub();
      scope.linkSingle = true;
    });

    describe('adds a link for an entry and updates linked entries', function () {
      function makeSpec(name, expectations) {
        it(name, function () {
          this.async(function (done) {
            var addLinkDeferred = $q.defer();
            callbackSpy = makeCallbackSpy(addLinkDeferred);
            var linkedEntitiesDeferred = makeLinkedEntitiesDeferred();
            scope.otChangeValue.callsArgAsync(1);

            $q.all([addLinkDeferred.promise, linkedEntitiesDeferred.promise]).then(_.partial(expectations, done));
            scope.addLink(entry, callbackSpy);
          });
        });
      }

      makeSpec('otChangeValue is called', function (done) {
        expect(scope.otChangeValue.called).toBeTruthy();
        done();
      });

      makeSpec('updateModel is called', function (done) {
        expect(scope.updateModel.called).toBeTruthy();
        done();
      });

      makeSpec('callback is called', function (done) {
        expect(callbackSpy.called).toBeTruthy();
        done();
      });

      makeSpec('getEntries is called', function (done) {
        expect(getEntriesStub.called).toBeFalsy();
        done();
      });

      makeSpec('added entry is first on the list', function (done) {
        expect(scope.links[0].sys.id).toEqual('entry1');
        done();
      });

      makeSpec('linkedEntities have been set', function (done) {
        expect(scope.linkedEntities.length).toBeGreaterThan(0);
        done();
      });

    });


    describe('removes a link for an entry and updates linked entries', function () {
      beforeEach(function () {
        scope.links = [
          {sys: {id: 'entry1'}},
          {sys: {id: 'entry2'}},
          {sys: {id: 'entry3'}}
        ];
        scope.otChangeValue.callsArg(1);
        scope.removeLink(0, entry);
      });

      it('otChangeValue is called', function () {
        expect(scope.otChangeValue.called).toBeTruthy();
      });

      it('updateModel is called', function () {
        expect(scope.updateModel.called).toBeTruthy();
      });

      it('list is empty', function () {
        expect(scope.links.length).toBe(0);
      });
    });

  });

  describe('attaches a list of entries to an entry directive', function () {
    var callbackSpy;
    beforeEach(function () {
      attrs.cfLinkEditor = 'entries';
    });

    describe('adds an array of entries from a list', function () {
      function makeSpec(name, expectations) {
        it(name, function () {
          this.async(function (done) {
            var addLinkDeferred = $q.defer();
            callbackSpy = makeCallbackSpy(addLinkDeferred);
            var linkedEntitiesDeferred = makeLinkedEntitiesDeferred();
            otDocPushStub.callsArgAsync(1);
            shareJSMock.peek.returns([]);

            $q.all([addLinkDeferred.promise, linkedEntitiesDeferred.promise]).then(_.partial(expectations, done));

            scope.addLink(entry, callbackSpy);
          });
        });
      }

      makeSpec('otDocPush is called', function (done) {
        expect(otDocPushStub.called).toBeTruthy();
        done();
      });

      makeSpec('updateModel is called', function (done) {
        expect(scope.updateModel.called).toBeTruthy();
        done();
      });

      makeSpec('peek is called', function (done) {
        expect(shareJSMock.peek.called).toBeTruthy();
        done();
      });

      makeSpec('callback is called', function (done) {
        expect(callbackSpy.called).toBeTruthy();
        done();
      });

      makeSpec('getEntries is called', function (done) {
        expect(getEntriesStub.called).toBeFalsy();
        done();
      });

      makeSpec('added entry is first on the list', function (done) {
        expect(scope.links[0].sys.id).toEqual('entry1');
        done();
      });

      makeSpec('linkedEntities has been populated', function (done) {
        expect(scope.linkedEntities.length).toBe(1);
        done();
      });
    });

    describe('adds an entry from a list', function () {
      function makeSpec(name, expectations) {
        it(name, function () {
          this.async(function (done) {
            var addLinkDeferred = $q.defer();
            callbackSpy = makeCallbackSpy(addLinkDeferred);
            var linkedEntitiesDeferred = makeLinkedEntitiesDeferred();
            shareJSMock.peek.returns({});
            shareJSMock.mkpath.callsArgAsync(1);

            $q.all([addLinkDeferred.promise, linkedEntitiesDeferred.promise]).then(_.partial(expectations, done));

            scope.addLink(entry, callbackSpy);
          });
        });
      }

      makeSpec('updateModel is called', function (done) {
        expect(scope.updateModel.called).toBeTruthy();
        done();
      });

      makeSpec('mkpath is called', function (done) {
        expect(shareJSMock.mkpath.called).toBeTruthy();
        done();
      });

      makeSpec('callback is called', function (done) {
        expect(callbackSpy.called).toBeTruthy();
        done();
      });

      makeSpec('getEntries is called', function (done) {
        expect(getEntriesStub.called).toBeFalsy();
        done();
      });

      makeSpec('added entry is first on the list', function (done) {
        expect(scope.links[0].sys.id).toEqual('entry1');
        done();
      });

      makeSpec('linkedEntities has been populated', function (done) {
        expect(scope.linkedEntities.length).toBe(1);
        done();
      });

    });

    it('removes a link from an entry list', function () {
      this.async(function (done) {
        var addLinkDeferred = $q.defer();
        var callbackSpy = makeCallbackSpy(addLinkDeferred);
        var linkedEntitiesDeferred = makeLinkedEntitiesDeferred();
        otDocPushStub.callsArgAsync(1);
        shareJSMock.peek.returns([]);
        removeStub.callsArgAsync(0);

        $q.all([addLinkDeferred.promise, linkedEntitiesDeferred.promise]).then(function () {
          scope.removeLink(0, entry);
          _.defer(function () {
            expect(scope.links.length).toBe(0);
            done();
          });
        });
        scope.addLink(entry, callbackSpy);
      });
    });

  });

  describe('attaches a list of previously loaded entries', function () {
    beforeEach(function () {
      scope.fetchMethod = 'getEntries';
      getEntriesStub.callsArgWithAsync(1, null, [entry]);
    });

    it('and fetches them for caching', function () {
      this.async(function (done) {
        scope.$watch('linkedEntities', function (newval, oldval) {
          if(newval !== oldval){
            expect(getEntriesStub.calledWith({'sys.id[in]': 'entry1'})).toBeTruthy();
            expect(scope.linkedEntities.length).toBe(1);
            done();
          }
        });

        scope.links = [
          {
            sys: {
              id: 'entry1',
              linkType: 'Entry',
              type: 'Link'
            }
          }
        ];
        scope.$apply();
      });
    });
  });

});
