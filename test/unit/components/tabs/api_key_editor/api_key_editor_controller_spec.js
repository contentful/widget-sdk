'use strict';

describe('API key editor controller', function () {

  var scope, stubs, $q, $rootScope;
  var apiKeyEditorCtrl;
  var apiKey;

  beforeEach(function () {
    module('contentful/test', function ($provide) {
      stubs = $provide.makeStubs([
        'spaceGetId',
        'info',
        'serverError',
        'error',
        'logServerWarn',
        'createPreviewApiKey',
        'closeState'
      ]);
      $provide.constant('environment', {
        env: 'unittest',
        settings: {
          cdn_host: 'cdn_host'
        }
      });
      $provide.value('notification', {
        info: stubs.info,
        error: stubs.error,
      });
      $provide.value('logger', {
        logServerWarn: stubs.logServerWarn
      });
      $provide.value('navigation/closeState', stubs.closeState);
    });
    inject(function ($controller, $injector, spaceContext) {
      $q = $injector.get('$q');
      $rootScope = $injector.get('$rootScope');
      stubs.broadcast = sinon.stub($rootScope, '$broadcast');
      stubs.broadcast.returns({});
      scope = $rootScope.$new();

      spaceContext.space = {
        getId: stubs.spaceGetId,
        createPreviewApiKey: stubs.createPreviewApiKey
      };

      scope.context = {};
      apiKey = {
        data: {},
        getName: sinon.stub().returns('apiKeyName'),
        getId: sinon.stub(),
        delete: sinon.stub(),
        save: sinon.stub()
      };
      scope.apiKey = apiKey;

      stubs.createPreviewApiKey.returns($q.defer().promise);

      apiKeyEditorCtrl = $controller('ApiKeyEditorController', {$scope: scope});
      scope.$apply();
    });
  });

  afterEach(function () {
    stubs.broadcast.restore();
  });

  it('sets an apiKey on the scope', function () {
    expect(scope.apiKey).toEqual(apiKey);
  });

  it('sets the state title to new api key', function () {
    scope.$apply();
    expect(scope.context.title).toEqual('New Api Key');
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
      apiKey.getId.returns('123');
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
      apiKey.delete.resolves();
      scope.delete();
      scope.$apply();
    });

    it('info notification is shown', function () {
      sinon.assert.calledOnce(stubs.info);
    });

    it('event is broadcasted from space', function () {
      sinon.assert.calledOnce(stubs.closeState);
    });
  });

  describe('fails to delete an api key', function () {
    beforeEach(function () {
      apiKey.delete.rejects({});
      scope.delete();
      scope.$apply();
    });

    it('error notification is shown', function () {
      sinon.assert.called(stubs.logServerWarn);
      expect(stubs.logServerWarn.args[0][1]).toEqual({error: {}});
      sinon.assert.calledOnce(stubs.error);
    });
  });

  describe('saves an api key', function () {
    var pristineStub, $state;
    beforeEach(function () {
      pristineStub = sinon.stub();
      $state = this.$inject('$state');
      $state.go = sinon.stub().resolves();
      apiKey.save.resolves();
      scope.apiKeyForm = {
        '$setPristine': pristineStub
      };
      apiKeyEditorCtrl.save.execute();
      this.$apply();
    });

    it('info notification is shown', function () {
      sinon.assert.calledOnce(stubs.info);
    });

    it('form is reset as pristine', function () {
      sinon.assert.called(pristineStub);
    });

    it('gets api key editor from navigator', function () {
      sinon.assert.calledWith($state.go, 'spaces.detail.api.keys.detail', {
        apiKeyId: apiKey.getId()
      });
    });
  });

  describe('fails to save an api key', function () {
    beforeEach(function () {
      apiKey.save.rejects('AN ERROR');
      apiKeyEditorCtrl.save.execute();
      this.$apply();
    });

    it('error notification is shown', function () {
      sinon.assert.calledOnce(stubs.error);
      sinon.assert.calledOnce(stubs.logServerWarn);
      expect(stubs.logServerWarn.args[0][1]).toEqual({error: 'AN ERROR'});
    });
  });

});
