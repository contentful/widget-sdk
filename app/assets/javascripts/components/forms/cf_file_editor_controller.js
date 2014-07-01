'use strict';

angular.module('contentful').controller('CfFileEditorCtrl', ['$scope', function ($scope) {
  $scope.$watch('file', function (file, old, scope) {
    if (!scope.otDoc) return;
    if (/*!old && */file && !file.url) {
      scope.$emit('fileUploaded', file);
    } else if (!file && old) {
      scope.$emit('fileRemoved', old);
    }
  }, true);

}]);
