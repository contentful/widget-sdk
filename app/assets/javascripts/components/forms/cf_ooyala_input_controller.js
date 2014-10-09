'use strict';

angular.module('contentful').controller('cfOoyalaInputController', ['$attrs', '$scope', '$injector', function($attrs, $scope, $injector){

  var debounce                          = $injector.get('debounce');
  var ooyalaClient            = $injector.get('ooyalaClient');
  var debouncedFetchAssetInfoFromOoyala = debounce(fetchAssetInfoFromOoyala, 750);

  ooyalaClient.setOrganizationId($scope.spaceContext.space.getOrganizationId());

  $scope.ooyalaInput = {isLoading: false};

  $scope.$watch('ooyalaInput.assetId', fetchAssetInfo);

  this.clearField = clearField;
  this.resetField = resetField;

  function clearField() {
    $scope.ooyalaInput.assetId   = undefined;
  }

  function clearLoadingFlag(){
    $scope.ooyalaInput.isLoading = false;
  }

  function setLoadingFlag() {
    $scope.ooyalaInput.isLoading = true;
  }

  function resetField() {
    clearField();
    evalOnResetFieldCallback();
  }

  function fetchAssetInfo(assetId) {
    if (assetId) {
      setLoadingFlag();
      debouncedFetchAssetInfoFromOoyala();
    } else {
      clearLoadingFlag();
      evalOnResetFieldCallback();
    }
  }

  function fetchAssetInfoFromOoyala() {
    /*
     * We need this extra check here because by the moment
     * this function is called (after the debouncing period)
     * the field can be empty
     */
    if (!_.isEmpty($scope.ooyalaInput.assetId)){
      ooyalaClient.asset($scope.ooyalaInput.assetId)
        .then(evalOnValidAssetIdCallback)
        .catch(evalOnInvalidAssetIdCallback)
        .finally(clearLoadingFlag);
    }
  }

  function evalOnValidAssetIdCallback(response) {
    $scope.$eval($attrs.onValidAssetId, { asset: {
      assetId: $scope.ooyalaInput.assetId,
      playerId: response.player_id }
    });
  }

  function evalOnInvalidAssetIdCallback(error) {
    $scope.$eval($attrs.onInvalidAssetId, {error: error});
  }

  function evalOnResetFieldCallback() {
    $scope.$eval($attrs.onReset);
  }
}]);
