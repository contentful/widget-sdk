'use strict';

describe('cf Autocomplete controller', function () {
  var scope, attrs;
  var cfAutocompleteCtrl;
  var getEntriesStub;

  beforeEach(function () {
    module('contentful/test');
    inject(function ($rootScope, $controller, $parse) {
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

      attrs = {ngModel: 'fieldData.value'};

      cfAutocompleteCtrl = $controller('cfAutocompleteCtrl', {
        $scope: scope,
        $parse: $parse,
        $attrs: attrs
      });
    });
  });

  describe('attaches to a entry directive', function () {
    var entry;
    beforeEach(function () {
      attrs.cfAutocomplete = 'entry';
      entry = window.createMockEntity('entry1');
      scope.otChangeValue = sinon.stub();
    });

    it('adds a link for an entry and updates linked entries', inject(function ($q) {
      this.async(function (done) {
        var addLinkDeferred = $q.defer();
        var callbackSpy = sinon.spy(function () {
          _.defer(function () {
            scope.$apply(function () {
              addLinkDeferred.resolve();
            });
          });
        });

        scope.otChangeValue.callsArgAsync(1);

        var linkedEntriesDeferred = $q.defer();
        scope.$watch('linkedEntries', function () {
          _.defer(function () {
            scope.$apply(function () {
              linkedEntriesDeferred.resolve();
            });
          });
        });

        $q.all([addLinkDeferred.promise, linkedEntriesDeferred.promise]).then(function () {
          done();
          expect(scope.otChangeValue.called).toBeTruthy();
          expect(scope.updateModel.called).toBeTruthy();
          expect(callbackSpy.called).toBeTruthy();
          expect(scope.links[0].sys.id).toEqual('entry1');
          expect(scope.linkedEntries.length).toBeGreaterThan(0);
        });

        scope.addLink(entry, callbackSpy);
      });
    }));

    it('removes a link for an entry and updates linked entries', function () {
      scope.links = [1,2,3];
      scope.otChangeValue.callsArg(1);
      scope.removeLink(0, entry);
      expect(scope.otChangeValue.called).toBeTruthy();
      expect(scope.updateModel.called).toBeTruthy();
      expect(scope.links.length).toBe(0);
    });

  });

});
