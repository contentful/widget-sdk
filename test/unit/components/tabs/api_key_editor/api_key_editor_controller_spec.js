'use strict';

describe('API key editor controller', function () {

  var scope, stubs, $q, $rootScope;
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
        'logServerWarn',
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
        logServerWarn: stubs.logServerWarn
      });
    });
    inject(function ($controller, $injector) {
      $q = $injector.get('$q');
      $rootScope = $injector.get('$rootScope');
      stubs.broadcast = sinon.stub($rootScope, '$broadcast');
      stubs.broadcast.returns({});
      scope = $rootScope.$new();

      scope.spaceContext = {
        space: {
          getId: stubs.spaceGetId,
          createPreviewApiKey: stubs.createPreviewApiKey
        }
      };

      scope.context = {};
      apiKey = {
        data: {},
        getName: stubs.getName,
        getId: stubs.apiGetId,
        'delete': stubs.delete,
        save: stubs.save
      };
      scope.apiKey = apiKey;

      stubs.getName.returns('apiKeyName');
      stubs.createPreviewApiKey.returns($q.defer().promise);

      apiKeyEditorCtrl = $controller('ApiKeyEditorController', {$scope: scope});
      scope.$apply();
    });
  });

  afterEach(function () {
    stubs.broadcast.restore();
  });

  it('has a closing message', function () {
    expect(scope.context.closingMessage).toBeDefined();
  });

  it('sets an apiKey on the scope', function () {
    expect(scope.apiKey).toEqual(apiKey);
  });

  it('sets the state title to untitled', function () {
    scope.$apply();
    expect(scope.context.title).toEqual('Untitled');
  });

  it('sets the state title', function () {
    scope.apiKey.data.name = 'api name';
    scope.$apply();
    expect(scope.context.title).toEqual('api name');
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
    expect(scope.context.dirty).toBeTruthy();
  });

  it('gets the api url', function() {
    expect(scope.getApiUrl()).toEqual('cdn_host');
  });

  it('gets the api url for the preview api', function() {
    scope.authCodeExample.api = 'preview';
    expect(scope.getApiUrl()).toEqual('preview_host');
  });

  it('does not create a preview api for a blank key', function() {
    sinon.assert.notCalled(stubs.createPreviewApiKey);
  });

  describe('creates a preview api if none exists', function() {
    beforeEach(function() {
      scope.apiKey.data.accessToken = 'accessToken';
      stubs.apiGetId.returns('123');
      scope.$apply();
    });

    it('calls the creation method', function() {
      sinon.assert.called(stubs.createPreviewApiKey);
    });

    it('gets the delivery api key id', function() {
      expect(stubs.createPreviewApiKey.args[0][0].apiKeyId).toBe('123');
    });
  });

  describe('deletes an api key', function () {
    beforeEach(function () {
      stubs.delete.returns($q.when());
      scope.delete();
      scope.$apply();
    });

    it('info notification is shown', function () {
      sinon.assert.called(stubs.info);
      expect(stubs.info.args[0][0]).toEqual('"apiKeyName" deleted successfully');
    });

    it('event is broadcasted from space', function () {
      sinon.assert.calledWith(stubs.broadcast, 'entityDeleted', apiKey);
    });
  });

  describe('fails to delete an api key', function () {
    beforeEach(function () {
      stubs.delete.returns($q.reject({}));
      scope.delete();
      scope.$apply();
    });

    it('error notification is shown', function () {
      sinon.assert.called(stubs.logServerWarn);
      expect(stubs.logServerWarn.args[0][1]).toEqual({});
      expect(stubs.warn.args[0][0]).toEqual('"apiKeyName" could not be deleted');
    });
  });

  describe('saves an api key', function () {
    var pristineStub;
    beforeEach(function () {
      pristineStub = sinon.stub();
      stubs.save.returns($q.when());
      scope.$state.go = sinon.stub();
      scope.apiKeyForm = {
        '$setPristine': pristineStub
      };
      scope.save();
      scope.$apply();
    });

    it('info notification is shown', function () {
      sinon.assert.called(stubs.info);
      expect(stubs.info.args[0][0]).toEqual('"apiKeyName" saved successfully');
    });

    it('form is reset as pristine', function () {
      sinon.assert.called(pristineStub);
    });

    it('gets api key editor from navigator', function () {
      sinon.assert.calledWith(scope.$state.go, 'spaces.detail.api.keys.detail', {
        apiKeyId: apiKey.getId()
      });
    });
  });

  describe('fails to save an api key', function () {
    beforeEach(function () {
      stubs.save.returns($q.reject({}));
      scope.save();
      scope.$apply();
    });

    it('error notification is shown', function () {
      sinon.assert.called(stubs.logServerWarn);
      expect(stubs.logServerWarn.args[0][1]).toEqual({});
      expect(stubs.warn.args[0][0]).toEqual('"apiKeyName" could not be saved');
    });
  });

});
