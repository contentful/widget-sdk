'use strict';

angular.module('contentful').factory('OoyalaEditorControllerMixin', ['$injector', function($injector){
  var ooyalaClient = $injector.get('ooyalaClient');
  var OoyalaSearch = $injector.get('OoyalaSearch');

  var mixin = {
    customAttrsForPlayer               : customAttrsForPlayer,
    customAttrsForPlayerInSearchDialog : customAttrsForPlayerInSearchDialog,
    isWidgetReady                      : isWidgetReady,
    isWidgetStatus                     : isWidgetStatus,
    processLookupInProviderResult      : processLookupInProviderResult,
    loadingFeedbackMessage             : loadingFeedbackMessage,
    lookupVideoInProvider              : lookupVideoInProvider,
    shouldRenderVideoPlayer            : shouldRenderVideoPlayer,
    prepareSearch                      : prepareSearch,
    processSearchResults               : processSearchResults
  };

  return mixin;

  function customAttrsForPlayer(video) {
    return video;
  }

  function customAttrsForPlayerInSearchDialog(searchResult) {
    return {assetId: searchResult.id, playerId: searchResult.playerId};
  }

  function isWidgetReady() {
    return true;
  }

  function isWidgetStatus(value) {
    return value === 'ready';
  }

  function loadingFeedbackMessage(asset) {
    return 'Loading player for video ' + asset.assetId;
  }

  function lookupVideoInProvider(assetId) {
    return ooyalaClient.asset(assetId);
  }

  function processLookupInProviderResult(asset) {
    return {assetId: asset.embed_code, playerId: asset.player_id, name : asset.name};
  }

  function shouldRenderVideoPlayer(video) {
    return !!video.playerId;
  }

  function prepareSearch(query) {
    return new OoyalaSearch().where('name', query).limit(10);
  }

  function processSearchResults(results) {
    return results.map(function(i){
      return {
        id: i.embed_code,
        duration: i.msDuration,
        name: i.name,
        playerId: i.player_id,
        thumbnailUrl: i.preview_image_url
      };
    });
  }
}]);
