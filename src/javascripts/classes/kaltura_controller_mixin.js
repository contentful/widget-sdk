'use strict';

angular.module('contentful')
.factory('KalturaEditorControllerMixin', ['require', function(require){
  var LazyLoader = require('LazyLoader');
  var kalturaClientWrapper;
  var KalturaSearch;
  var status = 'loading';

  LazyLoader.get('kaltura')
  .then(function(){
    kalturaClientWrapper = require('kalturaClientWrapper');
    KalturaSearch        = require('KalturaSearch');
    return kalturaClientWrapper.init();
  }).then(setStatus('ready'), setStatus('failed'));

  function setStatus(val) {
    return function() { status = val; };
  }

  var mixin = {
    customAttrsForPlayer: customAttrsForPlayer,
    customAttrsForPlayerInSearchDialog: customAttrsForPlayerInSearchDialog,
    isWidgetReady: isWidgetReady,
    isWidgetStatus: isWidgetStatus,
    loadingFeedbackMessage: loadingFeedbackMessage,
    lookupVideoInProvider: lookupVideoInProvider,
    processLookupInProviderResult: processLookupInProviderResult,
    shouldRenderVideoPlayer: shouldRenderVideoPlayer,
    prepareSearch: prepareSearch,
    processSearchResults: processSearchResults,
    widgetPlayerDirective: 'cf-kaltura-player'
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
    var search = new KalturaSearch();
    var categoryId = kalturaClientWrapper.getCategoryId();

    search.where('nameLike', query);
    search.limit(10);
    if (categoryId) {
      // categoryAncestorIdIn: All entries within this categoy or in child categories
      // http://www.kaltura.com/api_v3/testmeDoc/?object=KalturaMediaEntryFilter
      search.where('categoryAncestorIdIn', categoryId);
    }

    return search;
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
