'use strict';

angular.module('contentful').factory('KalturaEditorControllerMixin', ['$injector', function($injector){
  var kalturaClientWrapper;
  var KalturaSearch;
  var status = 'loading';

  $injector.get('kalturaLoader').load().then(function(){
    kalturaClientWrapper = $injector.get('kalturaClientWrapper');
    KalturaSearch        = $injector.get('KalturaSearch');

    kalturaClientWrapper.init()
      .then(setStatus('ready'), setStatus('failed'));

    function setStatus(val) {
      return function() { status = val; };
    }
  });

  var mixin = {
    customAttrsForPlayer               : customAttrsForPlayer,
    customAttrsForPlayerInSearchDialog : customAttrsForPlayerInSearchDialog,
    isWidgetReady                      : isWidgetReady,
    isWidgetStatus                     : isWidgetStatus,
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
    return status === 'ready';
  }

  function isWidgetStatus(value) {
    return status === value;
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
    var search = new KalturaSearch().where('nameLike', query);
    var categoryId = kalturaClientWrapper.getCategoryId();
    if(categoryId)
      search.where('categoriesIdsMatchAnd', categoryId);
    return search.limit(10);
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
