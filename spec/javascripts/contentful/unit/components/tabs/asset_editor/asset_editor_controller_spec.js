'use strict';

describe('Asset editor controller', function () {

  var scope, stubs;
  var assetEditorCtrl;
  var process;

  beforeEach(function () {
    module('contentful/test', function ($provide) {
      stubs = $provide.makeStubs([
        'getPrivateLocales',
        'assetTitle',
        'isArchived',
        'process',
        'peek',
        'mkpath',
        'fileNameToTitle',
        'serverError',
        'getPublishedVersion',
        'fileProcessingFailed'
      ]);
      $provide.removeControllers('FormWidgetsController', 'PermissionController');

      $provide.value('ShareJS', {
        peek: stubs.peek,
        mkpath: stubs.mkpath
      });

      $provide.value('stringUtils', {
        fileNameToTitle: stubs.fileNameToTitle
      });

      $provide.value('notification', {
        serverError: stubs.serverError
      });
    });
    inject(function ($rootScope, $controller, $q) {
      scope = $rootScope.$new();
      scope.permissionController = { can: sinon.stub() };
      scope.permissionController.can.returns({can: true});

      process = $q.defer();

      var locale = {
        code: 'en-US',
        contentDeliveryApi: true,
        contentManagementApi: true,
        'default': true,
        name: 'en-US',
        publish: true
      };
      stubs.getPrivateLocales.returns([locale]);
      scope.spaceContext = {
        assetTitle: stubs.assetTitle,
        space: {
          getPrivateLocales: stubs.getPrivateLocales
        }
      };
      scope.validate = sinon.stub();

      var asset = {
        isArchived: stubs.isArchived,
        process: stubs.process.returns(process.promise),
        getPublishedVersion: stubs.getPublishedVersion
      };
      scope.tab = {
        params: {
          asset: asset
        }
      };

      assetEditorCtrl = $controller('AssetEditorController', {$scope: scope});
      scope.$apply();
    });
  });

  it('gets a title set on a tab', function () {
    stubs.assetTitle.returns('title');
    scope.$apply();
    expect(scope.tab.title).toBe('title');
  });

  describe('sets the otDisabled flag', function () {
    beforeEach(function () {
      stubs.isArchived.returns(false);
    });

    it('to disabled', function () {
      scope.permissionController.can.returns({can: true});
      scope.$apply();
      expect(scope.otDisabled).toBe(false);
    });

    it('to enabled', function () {
      scope.permissionController.can.returns({can: false});
      scope.$apply();
      expect(scope.otDisabled).toBe(true);
    });
  });

  describe('validation on publish', function () {
    beforeEach(inject(function ($compile, $rootScope, $controller, cfStub){
      scope = $rootScope.$new();
      scope.permissionController = { can: sinon.stub() };
      scope.permissionController.can.returns({can: true});

      var locale = {
        code: 'en-US',
        contentDeliveryApi: true,
        contentManagementApi: true,
        'default': true,
        name: 'en-US',
        publish: true
      };
      var space = cfStub.space('test');
      var asset = cfStub.asset(space, 'asset1', {}, {
        sys: {
          publishedVersion: 1
        }
      });

      asset.isArchived = sinon.stub().returns(false);
      scope.spaceContext = {
        activeLocales: sinon.stub().returns([locale]),
        space: {
          getPrivateLocales: sinon.stub().returns([locale])
        }
      };
      scope.tab = {
        params: {
          asset: asset
        }
      };
      assetEditorCtrl = $controller('AssetEditorController', {$scope: scope});
      scope.$digest();
    }));

    it('should validate if the published version has changed', function () {
      scope.validate = sinon.spy();
      scope.asset.data.sys.publishedVersion = 2;
      scope.$digest();
      expect(scope.validate).toBeCalled();
    });
  });

  describe('handles a fileUploaded event from CfFileEditor controller', function() {
    var otPath, childScope;
    beforeEach(function() {
      childScope = scope.$new();
      scope.otDoc = { version: 123 };
      otPath = ['fields', 'title', 'en-US'];
      var fileObj = {fileName: 'file.jpg'};
      scope.$on('fileProcessingFailed', stubs.fileProcessingFailed);
      scope.$emit('fileUploaded', fileObj, {code: 'en-US'});
    });

    it('calls asset processing', function () {
      expect(scope.asset.process).toBeCalled();
    });

    describe('on success', function() {
      beforeEach(function() {
        process.resolve({});
        stubs.peek.returns(null);
        stubs.fileNameToTitle.returns('file');
        scope.$apply();
      });

      it('looks for otDoc with locale', function() {
        expect(stubs.peek).toBeCalledWith(scope.otDoc, otPath);
      });

      it('creates otDoc', function() {
        expect(stubs.mkpath).toBeCalled();
      });

      it('creates otDoc with doc', function() {
        expect(stubs.mkpath.args[0][0].doc).toEqual(scope.otDoc);
      });

      it('creates otDoc with path', function() {
        expect(stubs.mkpath.args[0][0].path).toEqual(otPath);
      });

      it('creates otDoc with filename', function() {
        expect(stubs.mkpath.args[0][0].value).toEqual('file');
      });
    });

    describe('on error', function() {
      beforeEach(function() {
        process.reject({});
        scope.$apply();
      });

      it('calls error notification', function() {
        expect(stubs.serverError).toBeCalled();
      });

      it('emits file processing failure event', function() {
        expect(stubs.fileProcessingFailed).toBeCalled();
      });
    });
  });

  // TODO test dirty flag
});
