'use strict';

describe('API key editor controller', function () {

  let scope, stubs;

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

      $provide.value('notification', {
        info: stubs.info,
        error: stubs.error
      });
      $provide.value('logger', {
        logServerWarn: stubs.logServerWarn
      });
      $provide.value('navigation/closeState', stubs.closeState);
      $provide.value('analytics/Analytics', {});
    });

    const $controller = this.$inject('$controller');
    const $q = this.$inject('$q');
    const $rootScope = this.$inject('$rootScope');
    const spaceContext = this.$inject('spaceContext');

    stubs.broadcast = sinon.stub($rootScope, '$broadcast');
    stubs.broadcast.returns({});
    scope = $rootScope.$new();

    spaceContext.space = {
      getId: stubs.spaceGetId,
      createPreviewApiKey: stubs.createPreviewApiKey
    };

    stubs.refresh = sinon.stub();
    spaceContext.apiKeys = {refresh: stubs.refresh};

    scope.context = {};
    scope.apiKey = {
      data: {},
      getName: sinon.stub().returns('apiKeyName'),
      getId: sinon.stub(),
      delete: sinon.stub(),
      save: sinon.stub()
    };
    stubs.createPreviewApiKey.returns($q.defer().promise);

    this.controller = $controller('ApiKeyEditorController', {$scope: scope});
    scope.$apply();
  });

  afterEach(function () {
    stubs.broadcast.restore();
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

  it('sets the dirty param on the tab', function () {
    scope.apiKeyForm = {
      '$dirty': true
    };
    scope.$apply();
    expect(scope.context.dirty).toBeTruthy();
  });

  it('does not create a preview api for a blank key', function () {
    sinon.assert.notCalled(stubs.createPreviewApiKey);
  });

  describe('creates a preview api if none exists', function () {
    beforeEach(function () {
      scope.apiKey.data.accessToken = 'accessToken';
      scope.apiKey.getId.returns('123');
      scope.$apply();
    });

    it('calls the creation method', function () {
      sinon.assert.called(stubs.createPreviewApiKey);
    });

    it('gets the delivery api key id', function () {
      expect(stubs.createPreviewApiKey.args[0][0].apiKeyId).toBe('123');
    });
  });

  describe('deletes an api key', function () {
    beforeEach(function () {
      scope.apiKey.delete.resolves();
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
      scope.apiKey.delete.rejects({});
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
    let pristineStub, $state;
    beforeEach(function () {
      pristineStub = sinon.stub();
      $state = this.$inject('$state');
      $state.go = sinon.stub().resolves();
      scope.apiKey.save.resolves();
      scope.apiKeyForm = {
        '$setPristine': pristineStub
      };
      this.controller.save.execute();
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
        apiKeyId: scope.apiKey.getId()
      });
    });

    it('updates API key list', function () {
      sinon.assert.calledOnce(stubs.refresh);
    });
  });

  describe('fails to save an api key', function () {
    beforeEach(function () {
      scope.apiKey.save.rejects('AN ERROR');
      this.controller.save.execute();
      this.$apply();
    });

    it('error notification is shown', function () {
      sinon.assert.calledOnce(stubs.error);
      sinon.assert.calledOnce(stubs.logServerWarn);
      expect(stubs.logServerWarn.args[0][1]).toEqual({error: 'AN ERROR'});
    });
  });

});
