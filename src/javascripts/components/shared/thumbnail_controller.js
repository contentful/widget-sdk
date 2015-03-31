'use strict';

angular.module('contentful').controller('ThumbnailController',
                                        ['$scope', '$injector', function ($scope, $injector) {

  var mimetype = $injector.get('mimetype');
  var assetUrlFilter = $injector.get('assetUrlFilter');

  $scope.$watch('file', function (file) {
    if(!file) $scope.imageHasLoaded = false;
  });

  $scope.$on('imageLoaded', function () {
    if($scope.file) $scope.imageHasLoaded = true;
  });
  $scope.$on('imageUnloaded', function () {
    $scope.imageHasLoaded = false;
  });

  $scope.isFileLoading = isFileLoading;
  $scope.isFilePreviewable = isFilePreviewable;
  $scope.hasPreview = hasPreview;
  $scope.getIconName = getIconName;

  function isFileLoading() {
    return $scope.hasPreview() && !$scope.imageHasLoaded;
  }

  function isFilePreviewable() {
    return !$scope.hasPreview() ||
           $scope.hasPreview() && $scope.imageHasLoaded;
  }

  function hasPreview() {
    return !!(
      $scope.file &&
      hasImagesDomain() &&
      mimetype.hasPreview({
        type: $scope.file.contentType,
        fallbackFileName: $scope.file.fileName
      })
    );
  }

  function hasImagesDomain() {
    return /\/\/images/g.test(assetUrlFilter($scope.file.url));
  }

  function getIconName() {
    var groupName = mimetype.getGroupLabel({
      type: $scope.file.contentType,
      fallbackFileName: $scope.file.fileName
    });
    return groupToIcon(groupName);
  }

  var groupToIconMap = {
    image: 'image',
    video: 'video',
    audio: 'audio',
    richtext: 'word',
    presentation: 'powerpoint',
    spreadsheet: 'excel',
    pdfdocument: 'pdf',
    archive: 'zip',
    plaintext: 'text',
    code: 'code',
    markup: 'code'
  };

  function groupToIcon(name) {
    if(name in groupToIconMap) return 'fa fa-file-'+groupToIconMap[name]+'-o';
    return 'fa fa-paperclip';
  }


}]);
