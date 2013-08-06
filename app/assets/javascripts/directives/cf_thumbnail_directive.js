'use strict';

angular.module('contentful').directive('cfThumbnail', function () {
  return {
    restrict: 'A',
    template: JST['cf_thumbnail'],

    link: function (scope, el, attrs) {
      scope.thumbnailSize = attrs.size;
    },

    controller: ['$scope', 'mimetypeGroups', function ($scope, mimetypeGroups) {

      function getExtension(fileName) {
        var ext = fileName.match(/\.\w+$/g);
        return ext && ext.length > 0 ? ext[0] : undefined;
      }

      function isInGroup(file, group){
        return group === mimetypeGroups.getName(
          getExtension(file.fileName),
          file.contentType
        );
      }

      _.each(mimetypeGroups.getGroupNames(), function (name) {
        $scope['is'+ name.charAt(0).toUpperCase() + name.slice(1)] = function () {
          return isInGroup($scope.file, name);
        };
      });

      $scope.hasPreview = function(){
        return mimetypeGroups.hasPreview(
          getExtension($scope.file.fileName),
          $scope.file.contentType
        );
      };

    }]
  };
});
