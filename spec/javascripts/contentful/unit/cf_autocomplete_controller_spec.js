'use strict';

describe('cf Autocomplete controller', function () {
  var scope, attrs, $q;
  var getEntriesStub, otDocPushStub, shareJSMock;
  var cfAutocompleteCtrl;
  var entry;

  function makeCallbackSpy(deferred){
    return sinon.spy(function () {
      _.defer(function () {
        scope.$apply(function () {
          deferred.resolve();
        });
      });
    });
  }

  function makeLinkedEntriesDeferred() {
    var deferred = $q.defer();
    scope.$watch('linkedEntries', function () {
      _.defer(function () {
        scope.$apply(function () {
          deferred.resolve();
        });
      });
    });
    return deferred;
  }

  beforeEach(function () {
    module('contentful/test');
    inject(function ($rootScope, $controller, $parse, _$q_) {
      $q = _$q_;
      scope = $rootScope.$new();

      scope.fieldData = {value: 'formfieldvalue'};
      scope.field = {
        type: 'Link',
        validations: []
      };
      scope.updateModel = sinon.stub();

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
      scope.otDoc.at.returns({
        push: otDocPushStub
      });

      shareJSMock = {
        peek: sinon.stub(),
        mkpath: sinon.stub()
      };

      attrs = {ngModel: 'fieldData.value'};

      entry = window.createMockEntity('entry1');

      cfAutocompleteCtrl = $controller('cfAutocompleteCtrl', {
        $scope: scope,
        $parse: $parse,
        $attrs: attrs,
        ShareJS: shareJSMock
      });
    });
  });

  describe('attaches one entry to an entry directive', function () {
    beforeEach(function () {
      attrs.cfAutocomplete = 'entry';
      scope.otChangeValue = sinon.stub();
    });

    it('adds a link for an entry and updates linked entries', function () {
      this.async(function (done) {
        var addLinkDeferred = $q.defer();
        var callbackSpy = makeCallbackSpy(addLinkDeferred);
        var linkedEntriesDeferred = makeLinkedEntriesDeferred();
        scope.otChangeValue.callsArgAsync(1);

        $q.all([addLinkDeferred.promise, linkedEntriesDeferred.promise]).then(function () {
          expect(scope.otChangeValue.called).toBeTruthy();
          expect(scope.updateModel.called).toBeTruthy();
          expect(callbackSpy.called).toBeTruthy();
          expect(getEntriesStub.called).toBeFalsy();
          expect(scope.links[0].sys.id).toEqual('entry1');
          expect(scope.linkedEntries.length).toBeGreaterThan(0);
          done();
        });

        scope.addLink(entry, callbackSpy);
      });
    });

    it('removes a link for an entry and updates linked entries', function () {
      scope.links = [1,2,3];
      scope.otChangeValue.callsArg(1);
      scope.removeLink(0, entry);
      expect(scope.otChangeValue.called).toBeTruthy();
      expect(scope.updateModel.called).toBeTruthy();
      expect(scope.links.length).toBe(0);
    });

  });

  describe('attaches a list of entries to an entry directive', function () {
    beforeEach(function () {
      attrs.cfAutocomplete = 'entries';
    });

    it('adds an array of entries from a list', function () {
      this.async(function (done) {
        var addLinkDeferred = $q.defer();
        var callbackSpy = makeCallbackSpy(addLinkDeferred);
        var linkedEntriesDeferred = makeLinkedEntriesDeferred();
        otDocPushStub.callsArgAsync(1);
        shareJSMock.peek.returns([]);

        $q.all([addLinkDeferred.promise, linkedEntriesDeferred.promise]).then(function () {
          expect(otDocPushStub.called).toBeTruthy();
          expect(scope.updateModel.called).toBeTruthy();
          expect(shareJSMock.peek.called).toBeTruthy();
          expect(callbackSpy.called).toBeTruthy();
          expect(getEntriesStub.called).toBeFalsy();
          expect(scope.links[0].sys.id).toEqual('entry1');
          expect(scope.linkedEntries.length).toBe(1);
          done();
        });

        scope.addLink(entry, callbackSpy);
      });
    });
  });

  describe('attaches another list of entries to an entry directive', function () {
    beforeEach(function () {
      attrs.cfAutocomplete = 'entries';
    });

    it('adds an entry from a list', function () {
      this.async(function (done) {
        var addLinkDeferred = $q.defer();
        var callbackSpy = makeCallbackSpy(addLinkDeferred);
        var linkedEntriesDeferred = makeLinkedEntriesDeferred();
        shareJSMock.peek.returns({});
        shareJSMock.mkpath.callsArgAsync(3);

        $q.all([addLinkDeferred.promise, linkedEntriesDeferred.promise]).then(function () {
          expect(scope.updateModel.called).toBeTruthy();
          expect(shareJSMock.mkpath.called).toBeTruthy();
          expect(callbackSpy.called).toBeTruthy();
          expect(getEntriesStub.called).toBeFalsy();
          expect(scope.links[0].sys.id).toEqual('entry1');
          expect(scope.linkedEntries.length).toBe(1);
          done();
        });

        scope.addLink(entry, callbackSpy);
      });
    });

  });

  describe('attaches a list of previously loaded entries', function () {
    beforeEach(function () {
      getEntriesStub.callsArgWithAsync(1, null, [entry]);
    });

    it('and fetches them for caching', function () {
      this.async(function (done) {
        scope.links = [
          {
            sys: {
              id: 'entry1',
              linkType: 'Entry',
              type: 'Link'
            }
          }
        ];

        scope.$watch('linkedEntries', function (newval, oldval) {
          if(newval !== oldval){
            expect(getEntriesStub.calledWith({'sys.id[in]': 'entry1'})).toBeTruthy();
            expect(scope.linkedEntries.length).toBe(1);
            done();
          }
        });
      });
    });
  });

});
