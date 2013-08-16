'use strict';

describe('Asset editor controller', function () {

  var scope, childScope, cfFileEditorCtrl, assetEditorCtrl;
  var fileObj, processStub;

  beforeEach(function () {
    module('contentful/test');
    inject(function ($rootScope, $controller) {
      fileObj = {fileName: 'file.jpg'};
      scope = $rootScope.$new();
      scope.tab = {};
      var locale = {
        code: 'en-US',
        contentDeliveryApi: true,
        contentManagementApi: true,
        'default': true,
        name: 'en-US',
        publish: true
      };
      var getPublishLocalesStub = sinon.stub();
      getPublishLocalesStub.returns([locale]);
      scope.spaceContext = { space: { getPublishLocales: getPublishLocalesStub } };
      scope.otDoc = {
        version: 123
      };
      processStub = sinon.stub();
      var asset = {
        process: processStub,
        data: {
          fields: {
            file: {
              en: fileObj
            }
          }
        }
      };
      scope.asset = asset;
      scope.tab.params = {
        asset: asset
      };
      assetEditorCtrl = $controller('AssetEditorCtrl', {$scope: scope});
      childScope = scope.$new();
      cfFileEditorCtrl = $controller('CfFileEditorCtrl', {$scope: childScope});
      childScope.$apply();
    });
  });

  it('handles a fileUploaded event from CfFileEditor controller', function () {
    this.async(function (done) {
      childScope.$apply(function () {
        childScope.file = fileObj;
        _.defer(function () {
          expect(processStub.called).toBe(true);
          done();
        });
      });
    });
  });

});
