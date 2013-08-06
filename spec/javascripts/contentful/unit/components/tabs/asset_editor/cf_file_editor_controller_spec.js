'use strict';

describe('File editor controller', function () {

  var cfFileEditorCtrl, mimetypeGroups, $rootScope;

  beforeEach(function () {
    module('contentful/test');
    inject(function (_$rootScope_, $controller, _mimetypeGroups_) {
      $rootScope = _$rootScope_;
      cfFileEditorCtrl = $controller('CfFileEditorCtrl', {$scope: $rootScope});
      mimetypeGroups = _mimetypeGroups_;
    });
  });

  it('has file group check methods', function () {
    $rootScope.file = {
      contentType: 'image/jpeg',
      fileName: 'file.jpg'
    };
    $rootScope.$apply();
    expect($rootScope.isImage()).toBe(true);
  });

});
