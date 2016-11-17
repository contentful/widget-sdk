'use strict';

describe('Asset editor controller', function () {

  let scope;

  beforeEach(function () {
    const createDoc = sinon.stub();
    module('contentful/test', ($provide) => {
      $provide.removeControllers(
        'FormWidgetsController',
        'entityEditor/LocalesController',
        'entityEditor/StatusNotificationsController'
      );
      $provide.factory('TheLocaleStore', ['mocks/TheLocaleStore', _.identity]);
      $provide.value('entityEditor/Document', {create: createDoc});
    });

    createDoc.returns(this.$inject('mocks/entityEditor/Document').create());
    scope = this.$inject('$rootScope').$new();
    const accessChecker = this.$inject('accessChecker');
    accessChecker.canUpdateAsset = sinon.stub().returns(true);

    const cfStub = this.$inject('cfStub');
    const space = cfStub.space('testSpace');
    const asset = cfStub.asset(space, 'testAsset', 'testType');
    scope.asset = asset;
    scope.entity = asset;
    scope.context = {};

    const $controller = this.$inject('$controller');
    $controller('AssetEditorController', {$scope: scope});

    scope.validate = sinon.stub();

    scope.$apply();
  });

  afterEach(function () {
    scope = null;
  });

  it('gets a title set', function () {
    const spaceContext = this.$inject('spaceContext');
    spaceContext.assetTitle = sinon.stub().returns('title');
    scope.$apply();
    expect(scope.context.title).toBe('title');
  });

  describe('"fileUpload" event', function () {
    it('sets the document title if it is not yet present', function () {
      scope.$emit('fileUploaded', {fileName: 'file.jpg'}, {internal_code: 'en-US'});
      sinon.assert.calledWith(scope.otDoc.setValueAt, ['fields', 'title', 'en-US'], 'file');
    });

    it('does not set the document title if it present', function () {
      scope.otDoc.getValueAt = sinon.stub();
      scope.otDoc.getValueAt.withArgs(['fields', 'title', 'en-US']).returns('title');
      scope.$emit('fileUploaded', {fileName: 'file.jpg'}, {internal_code: 'en-US'});
      sinon.assert.notCalled(scope.otDoc.setValueAt);
    });

    it('processes the asset', function () {
      scope.asset.process = sinon.stub().resolves();
      scope.otDoc.getVersion.returns(123);
      scope.$emit('fileUploaded', {fileName: ''}, {internal_code: 'en-US'});
      sinon.assert.calledWith(scope.asset.process, 123, 'en-US');
    });

    it('shows error when asset processing fails', function () {
      const notification = this.$inject('notification');

      scope.asset.process = sinon.stub().rejects();
      const processingFailed = sinon.stub();
      scope.$on('fileProcessingFailed', processingFailed);
      scope.$emit('fileUploaded', {fileName: ''}, {internal_code: 'en-US'});
      this.$apply();
      sinon.assert.called(notification.error);
      sinon.assert.called(processingFailed);
    });
  });
});
