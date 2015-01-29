'use strict';

angular.module('contentful').factory('KalturaEditorControllerMixin', ['$injector', function($injector){
  var isReady = false, kalturaClientWrapper, KalturaSearch;

  $injector.get('kalturaLoader').load().then(function(){
    kalturaClientWrapper = $injector.get('kalturaClientWrapper');
    KalturaSearch        = $injector.get('KalturaSearch');

    isReady = true;
  });


  var mixin = {
    customAttrsForPlayer               : customAttrsForPlayer,
    customAttrsForPlayerInSearchDialog : customAttrsForPlayerInSearchDialog,
    isWidgetReady                      : isWidgetReady,
    loadingFeedbackMessage             : loadingFeedbackMessage,
    lookupVideoInProvider              : lookupVideoInProvider,
    processLookupInProviderResult      : processLookupInProviderResult,
    shouldRenderVideoPlayer            : shouldRenderVideoPlayer,
    prepareSearch                      : prepareSearch,
    processSearchResults               : processSearchResults
  };

  return mixin;

  function customAttrsForPlayer(video) {
    return video;
  }


  function customAttrsForPlayerInSearchDialog(searchResult) {
    return {entryId: searchResult.id};
  }

  function isWidgetReady() {
    return isReady;
  }

  function loadingFeedbackMessage(asset) {
    return 'Loading player for entry ' + asset.entryId;
  }

  function lookupVideoInProvider(assetId) {
    return kalturaClientWrapper.entry(assetId);
  }

  function processLookupInProviderResult(asset) {
    return {entryId: asset.assetId, name : asset.name};
  }

  function shouldRenderVideoPlayer(video) {
    return !!video.entryId;
  }

  function prepareSearch(query) {
    return new KalturaSearch().where('nameLike', query).limit(10);
  }

  function processSearchResults(results) {
    return results.map(function(i){
      return {
        id: i.id,
        duration: i.msDuration,
        name: i.name,
        thumbnailUrl: i.thumbnailUrl
      };
    });
  }
}]);
