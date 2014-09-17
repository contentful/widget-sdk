'use strict';

describe('API key editor controller', function () {

  var scope, stubs;
  var apiKeyEditorCtrl;
  var apiKey;

  beforeEach(function () {
    module('contentful/test', function ($provide) {
      stubs = $provide.makeStubs([
        'spaceGetId',
        'delete',
        'save',
        'apiGetId',
        'getName',
        'info',
        'serverError',
        'warn',
        'broadcast',
        'logServerError',
        'createPreviewApiKey'
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
          getId: stubs.spaceGetId,
          createPreviewApiKey: stubs.createPreviewApiKey
        }
      };
      scope.broadcastFromSpace = stubs.broadcast;

      apiKey = {
        data: {},
        getName: stubs.getName,
        getId: stubs.apiGetId,
        'delete': stubs.delete,
        save: stubs.save
      };
      scope.tab.params.apiKey = apiKey;

      stubs.getName.returns('apiKeyName');

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
    scope.apiKey.data.name = 'api name';
    scope.$apply();
    expect(scope.headline).toEqual('api name');
    expect(scope.tab.title).toEqual('api name');
  });

  it('sets an example url', function () {
    scope.apiKey.data.accessToken = 'accessToken';
    stubs.spaceGetId.returns('spaceid');
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

  it('does not create a preview api for a blank key', function() {
    expect(stubs.createPreviewApiKey).not.toBeCalled();
  });

  describe('creates a preview api if none exists', function() {
    beforeEach(function() {
      scope.apiKey.data.accessToken = 'accessToken';
      stubs.apiGetId.returns('123');
      scope.$apply();
    });

    it('calls the creation method', function() {
      expect(stubs.createPreviewApiKey).toBeCalled();
    });

    it('gets the delivery api key id', function() {
      expect(stubs.createPreviewApiKey.args[0][0].apiKeyId).toBe('123');
    });
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
