'use strict';

describe('Entry list controller', function () {

  var entryListCtrl, entryListActionsCtrl;
  var scope, childScope;
  var removedEntry;

  beforeEach(function () {
    module('contentful/test');
    inject(function ($rootScope, $controller) {
      scope = $rootScope.$new();
      removedEntry = window.createMockEntity('entry2');
      scope.entries = [
        window.createMockEntity('entry1'),
        removedEntry,
        window.createMockEntity('entry3')
      ];
      entryListCtrl = $controller('EntryListCtrl', {$scope: scope});
      childScope = scope.$new();
      entryListActionsCtrl = $controller('EntryListActionsCtrl', {$scope: childScope});
    });
  });

  afterEach(function () {
  });

  it('handles an entityDeleted event from EntryListActions controller', function () {
    childScope.selection.toggle(removedEntry);
    childScope.deleteSelected();
    expect(scope.entries.length).toEqual(2);
    expect(scope.entries[0].getId()).toEqual('entry1');
    expect(scope.entries[1].getId()).toEqual('entry3');
  });

});
