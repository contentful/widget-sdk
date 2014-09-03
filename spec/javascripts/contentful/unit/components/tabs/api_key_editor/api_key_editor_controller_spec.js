'use strict';

describe('API key editor controller', function () {

  var scope, stubs;
  var apiKeyEditorCtrl;
  var apiKey;

  beforeEach(function () {
    module('contentful/test', function ($provide) {
      stubs = $provide.makeStubs([
        'id',
        'delete',
        'save',
        'name',
        'info',
        'serverError',
        'warn',
        'broadcast',
        'logServerError'
      ]);
      $provide.constant('environment', {
        settings: {
          cdn_host: 'cdn_host'
        }
      });
      $provide.value('notification', {
        info: stubs.info,
        warn: stubs.warn,
        serverError: stubs.serverError
      });
      $provide.value('logger', {
        logServerError: stubs.logServerError
      });
    });
    inject(function (_$rootScope_, $controller) {
      scope = _$rootScope_;

      scope.tab = {
        params: {}
      };
      scope.spaceContext = {
        space: {
          getId: stubs.id
        }
      };
      scope.broadcastFromSpace = stubs.broadcast;

      apiKey = {
        getName: stubs.name,
        'delete': stubs.delete,
        save: stubs.save
      };
      scope.tab.params.apiKey = apiKey;

      stubs.name.returns('apiKeyName');

      apiKeyEditorCtrl = $controller('ApiKeyEditorCtrl', {$scope: scope});
      scope.$apply();
    });
  });

  afterEach(inject(function ($log) {
    $log.assertEmpty();
  }));

  it('has a closing message', function () {
    expect(scope.tab.closingMessage).toBeDefined();
    expect(scope.tab.closingMessageDisplayType).toEqual('dialog');
  });

  it('sets an apiKey on the scope', function () {
    expect(scope.apiKey).toEqual(apiKey);
  });

  it('sets a headline and a tab title to untitled', function () {
    scope.$apply();
    expect(scope.headline).toEqual('Untitled');
    expect(scope.tab.title).toEqual('Untitled');
  });

  it('sets a headline and a tab title', function () {
    scope.apiKey = {
      data: {name: 'tabName'}
    };
    scope.$apply();
    expect(scope.headline).toEqual('tabName');
    expect(scope.tab.title).toEqual('tabName');
  });

  it('sets an example url', function () {
    scope.apiKey = {
      data: {accessToken: 'accessToken'}
    };
    stubs.id.returns('spaceid');
    scope.$apply();
    expect(scope.exampleUrl).toEqual('http://cdn_host/spaces/spaceid/entries?access_token=accessToken');
  });

  it('sets the dirty param on the tab', function () {
    scope.apiKeyForm = {
      '$dirty': true
    };
    scope.$apply();
    expect(scope.tab.dirty).toBeTruthy();
  });

  describe('deletes an api key', function () {
    beforeEach(function () {
      stubs.delete.callsArg(0);
      scope['delete']();
    });

    it('info notification is shown', function () {
      expect(stubs.info).toBeCalled();
      expect(stubs.info.args[0][0]).toEqual('"apiKeyName" deleted successfully');
    });

    it('event is broadcasted from space', function () {
      expect(stubs.broadcast).toBeCalled();
      expect(stubs.broadcast.args[0][0]).toEqual('entityDeleted');
      expect(stubs.broadcast.args[0][1]).toBe(apiKey);
    });
  });

  describe('fails to delete an api key', function () {
    beforeEach(function () {
      stubs.delete.callsArgWith(0, {});
      scope['delete']();
    });

    it('error notification is shown', function () {
      expect(stubs.logServerError).toBeCalled();
      expect(stubs.logServerError.args[0][1]).toEqual({});
      expect(stubs.warn.args[0][0]).toEqual('"apiKeyName" could not be deleted');
    });
  });

  describe('saves an api key', function () {
    var pristineStub, apiKeyEditorStub, goToStub;
    beforeEach(function () {
      pristineStub = sinon.stub();
      goToStub = sinon.stub();
      apiKeyEditorStub = sinon.stub();
      apiKeyEditorStub.returns({
        goTo: goToStub
      });
      stubs.save.callsArg(0);

      scope.apiKeyForm = {
        '$setPristine': pristineStub
      };
      scope.navigator = {
        apiKeyEditor: apiKeyEditorStub
      };
      scope.save();
    });

    it('info notification is shown', function () {
      expect(stubs.info).toBeCalled();
      expect(stubs.info.args[0][0]).toEqual('"apiKeyName" saved successfully');
    });

    it('form is reset as pristine', function () {
      expect(pristineStub).toBeCalled();
    });

    it('gets api key editor from navigator', function () {
      expect(apiKeyEditorStub).toBeCalled();
      expect(apiKeyEditorStub.args[0][0]).toBe(apiKey);
    });

    it('reloads api key editor', function () {
      expect(goToStub).toBeCalled();
    });

  });

  describe('fails to save an api key', function () {
    beforeEach(function () {
      stubs.save.callsArgWith(0, {});
      scope.save();
    });

    it('error notification is shown', function () {
      expect(stubs.logServerError).toBeCalled();
      expect(stubs.logServerError.args[0][1]).toEqual({});
      expect(stubs.warn.args[0][0]).toEqual('"apiKeyName" could not be saved');
    });
  });

});
