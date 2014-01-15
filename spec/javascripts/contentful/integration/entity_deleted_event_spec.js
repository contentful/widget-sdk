'use strict';

describe('Entry list controller events', function () {

  var spaceCtrl, entryListCtrl, entryEditorCtrl, entryListActionsCtrl, entryActionsCtrl;
  var scope, childScope;
  var closeStub;
  var removedEntity;

  beforeEach(function () {
    module('contentful/test');
    inject(function ($rootScope, $controller, cfStub) {
      scope = $rootScope.$new();
      var space = cfStub.space('test');
      var contentTypeData = cfStub.contentTypeData('testType');
      scope.spaceContext = cfStub.spaceContext(space, [contentTypeData]);
      removedEntity = cfStub.entry(space, 'entry2', 'type', {}, {sys: {version:1}});
      scope.entries = [
        cfStub.entry(space, 'entry1'),
        removedEntity,
        cfStub.entry(space, 'entry3')
      ];

      scope.entry = removedEntity;
      closeStub = sinon.stub();
      scope.tab = {
        close: closeStub,
        params: {
          entry: removedEntity
        }
      };

      // Space Controller necessary for space broadcast method
      spaceCtrl = $controller('SpaceCtrl', {$scope: scope});

      entryListCtrl = $controller('EntryListCtrl', {$scope: scope});

      childScope = scope.$new();
      entryEditorCtrl = $controller('EntryEditorCtrl', {$scope: childScope});
      entryListActionsCtrl = $controller('EntryListActionsCtrl', {$scope: childScope});

      entryActionsCtrl = $controller('EntryActionsCtrl', {$scope: childScope});
      scope.$digest();
      childScope.$digest();
    });
  });

  afterEach(inject(function ($log) {
    $log.assertEmpty();
  }));

  describe('handles an entityDeleted event from EntryListActions controller', function () {
    beforeEach(inject(function (cfStub) {
      childScope.selection.toggle(removedEntity);
      childScope.deleteSelected();
      cfStub.adapter.respondWith(null, null);
    }));

    it('has 2 entries after deletion', function () {
      expect(scope.entries.length).toEqual(2);
    });

    it('has entry1', function () {
      expect(scope.entries[0].getId()).toEqual('entry1');
    });

    it('has entry3', function () {
      expect(scope.entries[1].getId()).toEqual('entry3');
    });
  });

  describe('handles an entityDeleted event from EntryActions controller', function () {
    beforeEach(inject(function (cfStub) {
      childScope['delete']();
      cfStub.adapter.respondWith(null, null);
    }));

    it('closes the tab', function () {
      expect(closeStub).toBeCalled();
    });

    it('has 2 entries after deletion', function () {
      expect(scope.entries.length).toEqual(2);
    });

    it('has entry1', function () {
      expect(scope.entries[0].getId()).toEqual('entry1');
    });

    it('has entry3', function () {
      expect(scope.entries[1].getId()).toEqual('entry3');
    });
  });

});



describe('Content Type Actions controller events', function () {

  var spaceCtrl, contentTypeEditorCtrl, contentTypeActionsCtrl;
  var removedEntity;
  var scope, childScope;
  var closeStub;

  beforeEach(function () {
    module('contentful/test');
    inject(function ($rootScope, $controller, cfStub) {
      scope = $rootScope.$new();
      var space = cfStub.space('test');
      var contentTypeData = cfStub.contentTypeData('testType');
      scope.spaceContext = cfStub.spaceContext(space, [contentTypeData]);
      removedEntity = cfStub.contentType(space, 'content_type1', 'contentType');
      scope.contentType = removedEntity;

      // Space Controller necessary for space broadcast method
      spaceCtrl = $controller('SpaceCtrl', {$scope: scope});

      closeStub = sinon.stub();
      scope.tab = {
        close: closeStub,
        params: {
          contentType: removedEntity
        }
      };
      childScope = scope.$new();
      contentTypeEditorCtrl = $controller('ContentTypeEditorCtrl', {$scope: childScope});
      contentTypeActionsCtrl = $controller('ContentTypeActionsCtrl', {$scope: childScope});

      scope.$digest();
      childScope.$digest();

      childScope['delete']();
      cfStub.adapter.respondWith(null, {name: 'contentType', sys: {}});
    });
  });

  afterEach(inject(function ($log) {
    $log.assertEmpty();
  }));


  it('handles an entityDeleted event from ContentTypeActions controller', function () {
    expect(closeStub).toBeCalled();
  });

});


describe('ApiKey List controller events', function () {

  var spaceCtrl, apiKeyListCtrl, apiKeyEditorCtrl;
  var scope, childScope;
  var closeStub, apiKeysStub;
  var removedEntity;

  beforeEach(function () {
    module('contentful/test');
    inject(function ($rootScope, $controller, cfStub) {
      scope = $rootScope.$new();
      var space = cfStub.space('test');
      var contentTypeData = cfStub.contentTypeData('testType');
      scope.spaceContext = cfStub.spaceContext(space, [contentTypeData]);
      removedEntity = cfStub.apiKey(space, 'apikey2', 'apiKey 2');
      var apiKeys = [
        cfStub.apiKey(space, 'apikey1', 'apiKey 1'),
        removedEntity,
        cfStub.apiKey(space, 'apikey3', 'apiKey 3')
      ];

      apiKeysStub = sinon.stub();
      apiKeysStub.callsArgWith(1, null, apiKeys);
      scope.spaceContext.space.getApiKeys = apiKeysStub;

      scope.apiKey = removedEntity;
      closeStub = sinon.stub();
      scope.tab = {
        close: closeStub,
        params: {
          apiKey: removedEntity
        }
      };

      // Space Controller necessary for space broadcast method
      spaceCtrl = $controller('SpaceCtrl', {$scope: scope});

      apiKeyListCtrl = $controller('ApiKeyListCtrl', {$scope: scope});

      childScope = scope.$new();
      apiKeyEditorCtrl = $controller('ApiKeyEditorCtrl', {$scope: childScope});
      scope.$digest();
      childScope.$digest();

      childScope['delete']();
      cfStub.adapter.respondWith(null, null);
    });
  });

  afterEach(inject(function ($log) {
    $log.assertEmpty();
  }));

  it('handles an entityDeleted event from ApiKeyEditor controller', function () {
    expect(closeStub).toBeCalled();
  });

  it('number of apikeys is now 2', function () {
    expect(scope.apiKeys.length).toEqual(2);
  });

});

