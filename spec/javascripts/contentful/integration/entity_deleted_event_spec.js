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
      spaceCtrl = $controller('SpaceController', {$scope: scope});

      entryListCtrl = $controller('EntryListController', {$scope: scope});

      childScope = scope.$new();
      entryEditorCtrl = $controller('EntryEditorController', {$scope: childScope});
      entryListActionsCtrl = $controller('EntryListActionsController', {$scope: childScope});

      entryActionsCtrl = $controller('EntryActionsController', {$scope: childScope});
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
      cfStub.adapter.resolveLast(null);
      scope.$apply();
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
      childScope.delete();
      cfStub.adapter.resolveLast(null);
      scope.$apply();
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
    module('contentful/test', function ($controllerProvider) {
      $controllerProvider.register('UiConfigController', angular.noop);
    });
    inject(function ($rootScope, $controller, cfStub) {
      scope = $rootScope.$new();
      var space = cfStub.space('test');
      var contentTypeData = cfStub.contentTypeData('testType');
      scope.spaceContext = cfStub.spaceContext(space, [contentTypeData]);
      removedEntity = cfStub.contentType(space, 'content_type1', 'contentType');
      scope.contentType = removedEntity;

      // Space Controller necessary for space broadcast method
      spaceCtrl = $controller('SpaceController', {$scope: scope});

      closeStub = sinon.stub();
      scope.tab = {
        close: closeStub,
        params: {
          contentType: removedEntity
        }
      };
      scope.user = {
        features: {}
      };
      childScope = scope.$new();
      contentTypeEditorCtrl = $controller('ContentTypeEditorController', {$scope: childScope});
      contentTypeActionsCtrl = $controller('ContentTypeActionsController', {$scope: childScope});

      scope.$digest();
      childScope.$digest();

      childScope.delete();
      cfStub.adapter.resolveLast({name: 'contentType', sys: {}});
      scope.$apply();
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

  beforeEach(function () {
    module('contentful/test');
    inject(function ($rootScope, $controller, cfStub, $q) {
      scope = $rootScope.$new();
      var space = cfStub.space('test');
      var contentTypeData = cfStub.contentTypeData('testType');
      scope.spaceContext = cfStub.spaceContext(space, [contentTypeData]);
      var removedEntity = cfStub.apiKey(space, 'apikey2', 'apiKey 2');
      var apiKeys = [
        cfStub.apiKey(space, 'apikey1', 'apiKey 1'),
        removedEntity,
        cfStub.apiKey(space, 'apikey3', 'apiKey 3')
      ];

      scope.spaceContext.space.getDeliveryApiKeys = sinon.stub().returns($q.when(apiKeys));

      scope.apiKey = removedEntity;
      scope.tab = {
        close: sinon.stub(),
        params: {
          apiKey: removedEntity
        }
      };

      // Space Controller necessary for space broadcast method
      spaceCtrl      = $controller('SpaceController', {$scope: scope});
      apiKeyListCtrl = $controller('ApiKeyListController', {$scope: scope});

      childScope = scope.$new();
      apiKeyEditorCtrl = $controller('ApiKeyEditorController', {$scope: childScope});
      scope.$apply();

      childScope.delete();
      cfStub.adapter.resolveLast(null);
      scope.$apply();
    });
  });

  afterEach(inject(function ($log) {
    $log.assertEmpty();
  }));

  it('handles an entityDeleted event from ApiKeyEditor controller', function () {
    expect(scope.tab.close).toBeCalled();
  });

  it('number of apikeys is now 2', function () {
    expect(scope.apiKeys.length).toEqual(2);
  });

});

