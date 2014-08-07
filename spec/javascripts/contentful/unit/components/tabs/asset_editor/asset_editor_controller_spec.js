'use strict';

describe('Asset editor controller', function () {

  var scope, stubs;
  var assetEditorCtrl;

  beforeEach(function () {
    module('contentful/test', function ($provide) {
      stubs = $provide.makeStubs([
        'can',
        'getPublishLocales',
        'assetTitle',
        'isArchived',
        'process',
        'peek',
        'mkpath',
        'fileNameToTitle',
        'serverError'
      ]);

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
    inject(function ($rootScope, $controller) {
      scope = $rootScope.$new();
      scope.can = stubs.can;

      var locale = {
        code: 'en-US',
        contentDeliveryApi: true,
        contentManagementApi: true,
        'default': true,
        name: 'en-US',
        publish: true
      };
      stubs.getPublishLocales.returns([locale]);
      scope.spaceContext = {
        assetTitle: stubs.assetTitle,
        space: {
          getPublishLocales: stubs.getPublishLocales
        }
      };
      scope.validate = sinon.stub();

      var asset = {
        isArchived: stubs.isArchived,
        process: stubs.process
      };
      scope.tab = {
        params: {
          asset: asset
        }
      };

      assetEditorCtrl = $controller('AssetEditorCtrl', {$scope: scope});
      scope.$apply();
    });
  });

  afterEach(inject(function ($log) {
    $log.assertEmpty();
  }));

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
      stubs.can.returns(true);
      scope.$apply();
      expect(scope.otDisabled).toBe(false);
    });

    it('to enabled', function () {
      stubs.can.returns(false);
      scope.$apply();
      expect(scope.otDisabled).toBe(true);
    });
  });

  describe('validation on publish', function () {
    beforeEach(inject(function ($compile, $rootScope, $controller, cfStub){
      scope = $rootScope.$new();
      stubs.can = sinon.stub();
      scope.can = stubs.can;
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
          getPublishLocales: sinon.stub().returns([locale])
        }
      };
      scope.tab = {
        params: {
          asset: asset
        }
      };
      assetEditorCtrl = $controller('AssetEditorCtrl', {$scope: scope});
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
    var otPath;
    beforeEach(function() {
      scope.otDoc = { version: 123 };
      otPath = ['fields', 'title', 'en-US'];
      var fileObj = {fileName: 'file.jpg'};
      scope.$emit('fileUploaded', fileObj, {code: 'en-US'});
    });

    it('calls asset processing', function () {
      expect(scope.asset.process).toBeCalled();
    });

    describe('on success', function() {
      beforeEach(function() {
        scope.asset.process.yield(null, {});
        stubs.peek.returns(null);
        stubs.fileNameToTitle.returns('file');
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
        scope.asset.process.yield({});
      });

      it('calls error notification', function() {
        expect(stubs.serverError).toBeCalled();
      });
    });
  });

  // TODO test dirty flag
});
