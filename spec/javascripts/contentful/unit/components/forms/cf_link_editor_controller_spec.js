'use strict';

describe('cf LinkEditor controller', function () {
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
    beforeEach(function () {
      attrs.cfLinkEditor = 'entry';
      scope.otChangeValue = sinon.stub();
      scope.linkSingle = true;
    });

    it('adds a link for an entry and updates linked entries', function () {
      this.async(function (done) {
        var addLinkDeferred = $q.defer();
        var callbackSpy = makeCallbackSpy(addLinkDeferred);
        var linkedEntitiesDeferred = makeLinkedEntitiesDeferred();
        scope.otChangeValue.callsArgAsync(1);

        $q.all([addLinkDeferred.promise, linkedEntitiesDeferred.promise]).then(function () {
          expect(scope.otChangeValue.called).toBeTruthy();
          expect(scope.updateModel.called).toBeTruthy();
          expect(callbackSpy.called).toBeTruthy();
          expect(getEntriesStub.called).toBeFalsy();
          expect(scope.links[0].sys.id).toEqual('entry1');
          expect(scope.linkedEntities.length).toBeGreaterThan(0);
          done();
        });

        scope.addLink(entry, callbackSpy);
      });
    });

    it('removes a link for an entry and updates linked entries', function () {
      scope.links = [
        {sys: {id: 'entry1'}},
        {sys: {id: 'entry2'}},
        {sys: {id: 'entry3'}}
      ];
      scope.otChangeValue.callsArg(1);
      scope.removeLink(0, entry);
      expect(scope.otChangeValue.called).toBeTruthy();
      expect(scope.updateModel.called).toBeTruthy();
      expect(scope.links.length).toBe(0);
    });

  });

  describe('attaches a list of entries to an entry directive', function () {
    beforeEach(function () {
      attrs.cfLinkEditor = 'entries';
    });

    it('adds an array of entries from a list', function () {
      this.async(function (done) {
        var addLinkDeferred = $q.defer();
        var callbackSpy = makeCallbackSpy(addLinkDeferred);
        var linkedEntitiesDeferred = makeLinkedEntitiesDeferred();
        otDocPushStub.callsArgAsync(1);
        shareJSMock.peek.returns([]);

        $q.all([addLinkDeferred.promise, linkedEntitiesDeferred.promise]).then(function () {
          expect(otDocPushStub.called).toBeTruthy();
          expect(scope.updateModel.called).toBeTruthy();
          expect(shareJSMock.peek.called).toBeTruthy();
          expect(callbackSpy.called).toBeTruthy();
          expect(getEntriesStub.called).toBeFalsy();
          expect(scope.links[0].sys.id).toEqual('entry1');
          expect(scope.linkedEntities.length).toBe(1);
          done();
        });

        scope.addLink(entry, callbackSpy);
      });
    });

    it('adds an entry from a list', function () {
      this.async(function (done) {
        var addLinkDeferred = $q.defer();
        var callbackSpy = makeCallbackSpy(addLinkDeferred);
        var linkedEntitiesDeferred = makeLinkedEntitiesDeferred();
        shareJSMock.peek.returns({});
        shareJSMock.mkpath.callsArgAsync(1);

        $q.all([addLinkDeferred.promise, linkedEntitiesDeferred.promise]).then(function () {
          expect(scope.updateModel.called).toBeTruthy();
          expect(shareJSMock.mkpath.called).toBeTruthy();
          expect(callbackSpy.called).toBeTruthy();
          expect(getEntriesStub.called).toBeFalsy();
          expect(scope.links[0].sys.id).toEqual('entry1');
          expect(scope.linkedEntities.length).toBe(1);
          done();
        });

        scope.addLink(entry, callbackSpy);
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
