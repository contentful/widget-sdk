'use strict';

describe('API key editor controller', function () {

  var scope;
  var apiKeyEditorCtrl;
  var apiKey;
  var idStub, deleteStub, nameStub, infoStub, serverErrorStub, broadcastStub, saveStub;

  beforeEach(function () {
    idStub = sinon.stub();
    deleteStub = sinon.stub();
    saveStub = sinon.stub();
    nameStub = sinon.stub();
    infoStub = sinon.stub();
    serverErrorStub = sinon.stub();
    broadcastStub = sinon.stub();

    module('contentful/test', function ($provide) {
      $provide.constant('environment', {
        settings: {
          cdn_host: 'cdn_host'
        }
      });
      $provide.value('notification', {
        info: infoStub,
        serverError: serverErrorStub
      });
    });
    inject(function (_$rootScope_, $controller) {
      scope = _$rootScope_;

      scope.tab = {
        params: {}
      };
      scope.spaceContext = {
        space: {
          getId: idStub
        }
      };
      scope.broadcastFromSpace = broadcastStub;

      apiKey = {
        getName: nameStub,
        'delete': deleteStub,
        save: saveStub
      };
      scope.tab.params.apiKey = apiKey;

      nameStub.returns('apiKeyName');

      apiKeyEditorCtrl = $controller('ApiKeyEditorCtrl', {$scope: scope});
      scope.$apply();
    });
  });

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
    idStub.returns('spaceid');
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
      deleteStub.callsArg(0);
      scope['delete']();
    });

    it('info notification is shown', function () {
      expect(infoStub.called).toBeTruthy();
      expect(infoStub.args[0][0]).toEqual('"apiKeyName" deleted successfully');
    });

    it('event is broadcasted from space', function () {
      expect(broadcastStub.called).toBeTruthy();
      expect(broadcastStub.args[0][0]).toEqual('entityDeleted');
      expect(broadcastStub.args[0][1]).toBe(apiKey);
    });
  });

  describe('fails to delete an api key', function () {
    beforeEach(function () {
      deleteStub.callsArgWith(0, {});
      scope['delete']();
    });

    it('error notification is shown', function () {
      expect(serverErrorStub.called).toBeTruthy();
      expect(serverErrorStub.args[0][0]).toEqual('"apiKeyName" could not be deleted');
      expect(serverErrorStub.args[0][1]).toEqual({});
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
      saveStub.callsArg(0);

      scope.apiKeyForm = {
        '$setPristine': pristineStub
      };
      scope.navigator = {
        apiKeyEditor: apiKeyEditorStub
      };
      scope.save();
    });

    it('info notification is shown', function () {
      expect(infoStub.called).toBeTruthy();
      expect(infoStub.args[0][0]).toEqual('"apiKeyName" saved successfully');
    });

    it('form is reset as pristine', function () {
      expect(pristineStub.called).toBeTruthy();
    });

    it('gets api key editor from navigator', function () {
      expect(apiKeyEditorStub.called).toBeTruthy();
      expect(apiKeyEditorStub.args[0][0]).toBe(apiKey);
    });

    it('reloads api key editor', function () {
      expect(goToStub.called).toBeTruthy();
    });

  });

  describe('fails to save an api key', function () {
    beforeEach(function () {
      saveStub.callsArgWith(0, {});
      scope.save();
    });

    it('error notification is shown', function () {
      expect(serverErrorStub.called).toBeTruthy();
      expect(serverErrorStub.args[0][0]).toEqual('"apiKeyName" could not be saved');
      expect(serverErrorStub.args[0][1]).toEqual({});
    });
  });

});
