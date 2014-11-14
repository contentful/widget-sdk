'use strict';

angular.module('contentful').controller('cfOoyalaInputController', ['$attrs', '$scope', '$injector', function($attrs, $scope, $injector){

  var debounce                          = $injector.get('debounce');
  var ooyalaClient                      = $injector.get('ooyalaClient');
  var modalDialog                       = $injector.get('modalDialog');
  var debouncedFetchAssetInfoFromOoyala = debounce(fetchAssetInfoFromOoyala, 750);

  ooyalaClient.setOrganizationId($scope.spaceContext.space.getOrganizationId());

  $scope.videoInput = _.extend({isLoading: false}, {
    assetId       : $attrs.value,
    searchEnabled : $scope.$eval($attrs.searchEnabled),
    searchConfig  : $scope.$eval($attrs.searchConfig)
  });

  $attrs.$observe('value', updateAssetId);
  $scope.$watch('videoInput.assetId', fetchAssetInfo);

  this.clearField = clearField;
  this.resetField = resetField;
  this.launchSearchDialog = launchSearchDialog;

  function clearField() {
    $scope.videoInput.assetId   = undefined;
  }

  function clearLoadingFlag(){
    $scope.videoInput.isLoading = false;
  }

  function setLoadingFlag() {
    $scope.videoInput.isLoading = true;
  }

  function resetField() {
    clearField();
    evalOnResetFieldCallback();
  }

  function updateAssetId(assetId) {
    $scope.videoInput.assetId = assetId;
  }

  function launchSearchDialog() {
    $scope.searchConfig.scope.ooyalaSearch = {
      isMultipleSelectionEnabled: $scope.searchConfig.isMultipleSelectionEnabled
    };

    modalDialog.open({
      scope: $scope.searchConfig.scope,
      template: $scope.searchConfig.template
    })
    .promise.then(function(selection){
      $scope.searchConfig.onSelection(selection);
    });
  }

  function fetchAssetInfo(assetId) {
    $scope.$eval($attrs.onChange, {input: assetId});

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
    if (!_.isEmpty($scope.videoInput.assetId)){
      ooyalaClient.asset($scope.videoInput.assetId)
        .then(evalOnValidAssetIdCallback)
        .catch(evalOnInvalidAssetIdCallback)
        .finally(clearLoadingFlag);
    }
  }

  function evalOnValidAssetIdCallback(response) {
    $scope.$eval($attrs.onValidAssetId, { asset: {
      assetId: $scope.videoInput.assetId,
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
