'use strict';

angular.module('contentful').controller('CfFileEditorCtrl', function ($scope) {

  $scope.$watch('file', function (file, old, scope) {
    scope.hasFile = !!file;
    if (file && !old) {
      scope.$emit('fileUploaded', file);
    } else if (!file && old) {
      scope.$emit('fileRemoved', old);
    }
  });

});
