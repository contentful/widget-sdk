'use strict';

describe('Asset editor controller', function () {

  var scope;

  beforeEach(function () {
    module('contentful/test', function ($provide) {
      $provide.removeControllers(
        'FormWidgetsController',
        'entityEditor/Document',
        'entityEditor/LocalesController',
        'entityEditor/StatusNotificationsController'
      );
    });

    scope = this.$inject('$rootScope').$new();
    var accessChecker = this.$inject('accessChecker');
    accessChecker.canUpdateAsset = sinon.stub().returns(true);

    var cfStub = this.$inject('cfStub');
    var space = cfStub.space('testSpace');
    var asset = cfStub.asset(space, 'testAsset', 'testType');
    scope.asset = asset;
    scope.context = {};

    var $controller = this.$inject('$controller');
    $controller('AssetEditorController', {$scope: scope});

    scope.otDoc = {
      doc: {},
      getValueAt: sinon.stub(),
      setValueAt: sinon.stub(),
      open: sinon.stub(),
      close: sinon.stub()
    };

    scope.validate = sinon.stub();

    scope.$apply();
  });

  afterEach(function () {
    scope = null;
  });

  it('gets a title set', function () {
    var spaceContext = this.$inject('spaceContext');
    spaceContext.assetTitle = sinon.stub().returns('title');
    scope.$apply();
    expect(scope.context.title).toBe('title');
  });

  it('validates if the published version has changed', function () {
    scope.asset.data.sys.publishedVersion = 1;
    scope.asset.isArchived = sinon.stub().returns(false);
    scope.$digest();

    scope.asset.data.sys.publishedVersion = 2;
    scope.$digest();
    sinon.assert.called(scope.validate);
  });

  describe('"fileUpload" event', function () {
    it('sets the document title if it is not yet present', function () {
      scope.$emit('fileUploaded', {fileName: 'file.jpg'}, {internal_code: 'en-US'});
      sinon.assert.calledWith(scope.otDoc.setValueAt, ['fields', 'title', 'en-US'], 'file');
    });

    it('does not set the document title if it present', function () {
      scope.otDoc.getValueAt.withArgs(['fields', 'title', 'en-US']).returns('title');
      scope.$emit('fileUploaded', {fileName: 'file.jpg'}, {internal_code: 'en-US'});
      sinon.assert.notCalled(scope.otDoc.setValueAt);
    });

    it('processes the asset', function () {
      scope.asset.process = sinon.stub().resolves();
      scope.otDoc.doc.version = 123;
      scope.$emit('fileUploaded', {fileName: ''}, {internal_code: 'en-US'});
      sinon.assert.calledWith(scope.asset.process, 123, 'en-US');
    });

    it('shows error when asset processing fails', function () {
      var notification = this.$inject('notification');

      scope.asset.process = sinon.stub().rejects();
      var processingFailed = sinon.stub();
      scope.$on('fileProcessingFailed', processingFailed);
      scope.$emit('fileUploaded', {fileName: ''}, {internal_code: 'en-US'});
      this.$apply();
      sinon.assert.called(notification.error);
      sinon.assert.called(processingFailed);
    });
  });
});
