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

  it('adds a link for an entry', inject(function ($q) {
    this.async(function (done) {
      var addLinkDeferred = $q.defer();
      var callbackSpy = sinon.spy(function () {
        _.defer(function () {
          scope.$apply(function () {
            addLinkDeferred.resolve();
          });
        });
      });
      var entry1 = window.createMockEntity('entry1');

      getEntriesStub.callsArgWithAsync(1, null, []);
      attrs.cfAutocomplete = 'entry';
      scope.otChangeValue = sinon.stub();
      scope.otChangeValue.callsArg(1);

      var linkedEntriesDeferred = $q.defer();
      scope.$watch('linkedEntries', function () {
        _.defer(function () {
          scope.$apply(function () {
            linkedEntriesDeferred.resolve();
            expect(scope.linkedEntries.length).toBeGreaterThan(0);
          });
        });
      });

      $q.all([addLinkDeferred.promise, linkedEntriesDeferred.promise]).then(function () {
        done();
      });

      scope.addLink(entry1, callbackSpy);

      expect(scope.otChangeValue.called).toBeTruthy();
      expect(scope.updateModel.called).toBeTruthy();
      expect(callbackSpy.called).toBeTruthy();
      expect(scope.links[0].sys.id).toEqual('entry1');
    });
  }));

});
