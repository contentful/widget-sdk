'use strict';

angular.module('contentful').controller('cfVideoInputController', ['$attrs', '$scope', '$injector', function($attrs, $scope, $injector){
  var controller = this;

  var assert                  = $injector.get('assert');
  var debounce                = $injector.get('debounce');
  var modalDialog             = $injector.get('modalDialog');
  var debouncedFetchAssetInfo = debounce(fetchAssetInfo, 750);

  assert.defined($attrs.assetLookup, 'Video Input Directive needs a callback to lookup details about the given asset id');

  $scope.videoInput = {
    isLoading     : false,
    assetId       : $attrs.value,
    searchConfig  : $scope.$eval($attrs.searchConfig)
  };

  $scope.videoInput.searchEnabled = $scope.videoInput.searchConfig.isSearchEnabled;


  $attrs.$observe('value', updateAssetId);
  $scope.$watch('videoInput.assetId', processNewAssetId);

  this.clearField         = clearField;
  this.resetField         = resetField;
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
    controller.clearField();
    evalOnResetFieldCallback();
  }

  function updateAssetId(assetId) {
    $scope.videoInput.assetId = assetId;
  }

  function launchSearchDialog() {
    modalDialog.open({
      scope: $scope.videoInput.searchConfig.scope,
      template: $scope.videoInput.searchConfig.template
    })
    .promise.then(function(selection){
      $scope.videoInput.searchConfig.onSelection(selection);
    });
  }

  function processNewAssetId(assetId) {
    $scope.$eval($attrs.onChange, {input: assetId});

    if (assetId) {
      setLoadingFlag();
      debouncedFetchAssetInfo();
    } else {
      clearLoadingFlag();
      evalOnResetFieldCallback();
    }
  }

  function fetchAssetInfo() {
    /*
     * We need this extra check here because by the moment
     * this function is called (after the debouncing period)
     * the field can be empty
     */
    if (!_.isEmpty($scope.videoInput.assetId)){
      $scope.$eval($attrs.assetLookup, {assetId: $scope.videoInput.assetId})
        .then(evalOnValidAssetIdCallback)
        .catch(evalOnInvalidAssetIdCallback)
        .finally(clearLoadingFlag);
    }
  }

  function evalOnValidAssetIdCallback(response) {
    $scope.$eval($attrs.onValidAssetId, { asset: _.extend({assetId: $scope.videoInput.assetId}, response) });
  }

  function evalOnInvalidAssetIdCallback(error) {
    $scope.$eval($attrs.onInvalidAssetId, {error: error});
  }

  function evalOnResetFieldCallback() {
    $scope.$eval($attrs.onReset);
  }
}]);
