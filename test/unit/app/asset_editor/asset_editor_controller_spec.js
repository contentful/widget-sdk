'use strict';

describe('Asset editor controller', function () {

  var scope, stubs, logger, notification;
  var assetEditorCtrl;
  var process;

  beforeEach(function () {
    var self = this;
    self.TheLocaleStoreMock = {
      getLocalesState: sinon.stub().returns({})
    };
    module('contentful/test', function ($provide) {
      stubs = $provide.makeStubs([
        'assetTitle',
        'isArchived',
        'process',
        'peek',
        'mkpathAndSetValue',
        'fileNameToTitle',
        'serverError',
        'getPublishedVersion',
        'fileProcessingFailed'
      ]);
      $provide.removeControllers(
        'FormWidgetsController',
        'entityEditor/LocalesController',
        'entityEditor/StatusNotificationsController'
      );

      $provide.value('ShareJS', {
        peek: stubs.peek,
        mkpathAndSetValue: stubs.mkpathAndSetValue
      });

      $provide.value('stringUtils', {
        fileNameToTitle: stubs.fileNameToTitle
      });

      $provide.value('TheLocaleStore', self.TheLocaleStoreMock);
    });
    inject(function ($rootScope, $controller, $q, $injector, cfStub) {
      logger = $injector.get('logger');
      notification = $injector.get('notification');
      scope = $rootScope.$new();
      scope.otDoc = {doc: {}, state: {}};
      scope.permissionController = {
        canPerformActionOnEntity: sinon.stub().returns(true)
      };


      scope.validate = sinon.stub();

      process = $q.defer();
      var space = cfStub.space('testSpace');
      var asset = cfStub.asset(space, 'testAsset', 'testType');
      asset = _.extend(asset, {
        isArchived: stubs.isArchived,
        process: stubs.process.returns(process.promise),
        getPublishedVersion: stubs.getPublishedVersion
      });

      scope.asset = asset;
      scope.context = {};

      assetEditorCtrl = $controller('AssetEditorController', {$scope: scope});
      scope.$apply();
    });
  });

  it('gets a title set', function () {
    var spaceContext = this.$inject('spaceContext');
    spaceContext.assetTitle = sinon.stub().returns('title');
    scope.$apply();
    expect(scope.context.title).toBe('title');
  });

  describe('sets the otDoc.state.disabled flag', function () {
    beforeEach(function () {
      scope.otDoc = {
        doc: {},
        state: { disabled: false }
      };
      stubs.isArchived.returns(false);
    });

    it('to disabled', function () {
      scope.permissionController.canPerformActionOnEntity.returns(true);
      scope.$apply();
      expect(scope.otDoc.state.disabled).toBe(false);
    });

    it('to enabled', function () {
      scope.permissionController.canPerformActionOnEntity.returns(false);
      scope.$apply();
      expect(scope.otDoc.state.disabled).toBe(true);
    });
  });

  describe('validation on publish', function () {
    beforeEach(inject(function ($compile, $rootScope, $controller, cfStub){
      scope = $rootScope.$new();
      scope.otDoc = {doc: {}, state: {}};
      scope.permissionController = {
        canPerformActionOnEntity: sinon.stub().returns(true)
      };

      var space = cfStub.space('test');
      var asset = cfStub.asset(space, 'asset1', {}, {
        sys: {
          publishedVersion: 1
        }
      });

      asset.isArchived = sinon.stub().returns(false);
      scope.asset = asset;
      scope.context = {};

      assetEditorCtrl = $controller('AssetEditorController', {$scope: scope});
      scope.$digest();
    }));

    it('should validate if the published version has changed', function () {
      scope.validate = sinon.spy();
      scope.asset.data.sys.publishedVersion = 2;
      scope.$digest();
      sinon.assert.called(scope.validate);
    });
  });

  describe('handles a fileUploaded event from CfFileEditor controller', function() {
    var otPath, childScope;
    beforeEach(function() {
      childScope = scope.$new();
      scope.otDoc = { doc: {version: 123} };
      otPath = ['fields', 'title', 'en-US'];
      var fileObj = {fileName: 'file.jpg'};
      scope.$on('fileProcessingFailed', stubs.fileProcessingFailed);
      scope.$emit('fileUploaded', fileObj, {internal_code: 'en-US'});
    });

    it('calls asset processing', function () {
      sinon.assert.called(scope.asset.process);
    });

    describe('on success', function() {
      beforeEach(function() {
        process.resolve({});
        stubs.peek.returns(null);
        stubs.fileNameToTitle.returns('file');
        scope.$apply();
      });

      it('looks for otDoc with locale', function() {
        sinon.assert.calledWith(stubs.peek, scope.otDoc.doc, otPath);
      });

      it('creates otDoc', function() {
        sinon.assert.called(stubs.mkpathAndSetValue);
      });

      it('creates otDoc with doc path and filename', function() {
        sinon.assert.calledOnce(stubs.mkpathAndSetValue);
        sinon.assert.calledWith(
          stubs.mkpathAndSetValue,
          scope.otDoc.doc, otPath, 'file'
        );
      });
    });

    describe('on error', function() {
      beforeEach(function() {
        process.reject({});
        scope.$apply();
      });

      it('calls error notification', function() {
        sinon.assert.called(notification.error);
        sinon.assert.called(logger.logServerWarn);
      });

      it('emits file processing failure event', function() {
        sinon.assert.called(stubs.fileProcessingFailed);
      });
    });
  });

  // TODO test dirty flag
});
