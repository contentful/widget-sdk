'use strict';

describe('Entry list controller', function () {

  var spaceCtrl, entryListCtrl, entryActionsCtrl, entryListActionsCtrl;
  var scope, childScope;
  var closeStub;
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

      scope.entry = removedEntry;
      closeStub = sinon.stub();
      scope.tab = {
        close: closeStub
      };

      entryListCtrl = $controller('EntryListCtrl', {$scope: scope});

      // Space Controller sends entityDeleted events back down the scopes
      spaceCtrl = $controller('SpaceCtrl', {$scope: scope});

      childScope = scope.$new();
      entryListActionsCtrl = $controller('EntryListActionsCtrl', {$scope: childScope});

      entryActionsCtrl = $controller('EntryActionsCtrl', {$scope: childScope});
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
    childScope.delete();
    expect(closeStub.called).toBeTruthy();
    expect(scope.entries.length).toEqual(2);
    expect(scope.entries[0].getId()).toEqual('entry1');
    expect(scope.entries[1].getId()).toEqual('entry3');
  });

});



describe('Content Type Actions controller', function () {

  var spaceCtrl, contentTypeActionsCtrl;
  var removedEntry;
  var scope, childScope;
  var closeStub;

  beforeEach(function () {
    module('contentful/test');
    inject(function ($rootScope, $controller) {
      scope = $rootScope.$new();
      removedEntry = window.createMockEntity('content_type1');
      scope.contentType = removedEntry;

      // Space Controller sends entityDeleted events back down the scopes
      spaceCtrl = $controller('SpaceCtrl', {$scope: scope});

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
    childScope.delete();
    expect(closeStub.called).toBeTruthy();
  });

});


