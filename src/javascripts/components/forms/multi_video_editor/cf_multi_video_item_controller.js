'use strict';

angular.module('contentful').controller('cfMultiVideoItemController', ['$attrs', '$scope', function($attrs, $scope){
  $scope.multiVideoItem = {
    isSortingEnabled : $scope.$eval($attrs.isSortingEnabled),
    isAssetValid     : false,
    isPlayerReady    : false,
    errorMessage     : undefined,
    asset            : $scope.$eval($attrs.asset),
    widgetPlayerDirective : $scope.$eval($attrs.widgetPlayerDirective),
    customAttrsForPlayer  : $scope.$eval($attrs.widgetPlayerCustomAttrs)
  };

  this.notifyPlayerIsReady        = notifyPlayerIsReady;
  this.removeAsset                = removeAsset;
  this.showFailedToLoadVideoError = showFailedToLoadVideoError;

  $scope.$eval($attrs.lookupAsset)
      .then(setAssetInfo)
      .catch(showError);

  function removeAsset() {
    $scope.$eval($attrs.removeAsset);
  }

  function setAssetInfo(response) {
    $scope.multiVideoItem.isAssetValid = true;
    $scope.multiVideoItem.asset.title  = response.name;
  }

  function showError(error) {
    $scope.multiVideoItem.errorMessage = error.message;
  }

  function showFailedToLoadVideoError() {
    //TODO: set proper error message
    showError({message: 'The video can not be played'});
  }

  function notifyPlayerIsReady() {
    $scope.multiVideoItem.isPlayerReady = true;
  }

}]);
