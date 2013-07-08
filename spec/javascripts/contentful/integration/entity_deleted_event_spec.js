'use strict';

describe('Entry list controller', function () {

  var entryListCtrl, entryActionsCtrl, entryListActionsCtrl;
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

      scope.entry = removedEntry;
      entryActionsCtrl = $controller('EntryActionsCtrl', {$scope: scope});
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

  it('handles an entityDeleted event from EntryActions controller', function () {
    scope.delete();
    expect(scope.entries.length).toEqual(2);
    expect(scope.entries[0].getId()).toEqual('entry1');
    expect(scope.entries[1].getId()).toEqual('entry3');
  });

});



describe('Entry Actions controller', function () {

  var entryListCtrl, entryActionsCtrl;
  var scope, childScope;
  var removedEntry;
  var closeStub;

  beforeEach(function () {
    module('contentful/test');
    inject(function ($rootScope, $controller) {
      scope = $rootScope.$new();
      removedEntry = window.createMockEntity('entry2');
      entryListCtrl = $controller('EntryListCtrl', {$scope: scope});

      scope.entry = removedEntry;
      closeStub = sinon.stub();
      scope.tab = {
        close: closeStub
      };
      childScope = scope.$new();
      entryActionsCtrl = $controller('EntryActionsCtrl', {$scope: childScope});
    });
  });

  afterEach(function () {
  });

  it('handles an entityDeleted event from EntryList controller', function () {
    scope.$broadcast('entityDeleted', removedEntry);
    expect(closeStub.called).toBeTruthy();
  });

});


describe('Content Type Actions controller', function () {

  var contentTypeActionsCtrl;
  var removedEntry;
  var scope, childScope;
  var closeStub;

  beforeEach(function () {
    module('contentful/test');
    inject(function ($rootScope, $controller) {
      scope = $rootScope.$new();
      removedEntry = window.createMockEntity('content_type1');
      scope.contentType = removedEntry;
      closeStub = sinon.stub();
      scope.tab = {
        close: closeStub
      };
      childScope = scope.$new();
      contentTypeActionsCtrl = $controller('ContentTypeActionsCtrl', {$scope: childScope});
    });
  });

  afterEach(function () {
  });

  it('handles an entityDeleted event from ContentTypeActions controller', function () {
    //scope.delete();
    scope.$broadcast('entityDeleted', removedEntry);
    expect(closeStub.called).toBeTruthy();
  });

});


