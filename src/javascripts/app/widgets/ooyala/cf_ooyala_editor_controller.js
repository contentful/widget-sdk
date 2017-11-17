'use strict';

angular.module('contentful')
.controller('cfOoyalaEditorController', ['require', function (require){
  var ooyalaClient = require('ooyalaClient');
  var OoyalaSearch = require('OoyalaSearch');
  var spaceContext = require('spaceContext');

  ooyalaClient.setOrganizationId(spaceContext.space.getOrganizationId());

  this.customAttrsForPlayer = customAttrsForPlayer;
  this.customAttrsForPlayerInSearchDialog = customAttrsForPlayerInSearchDialog;
  this.isWidgetReady = isWidgetReady;
  this.isWidgetStatus = isWidgetStatus;
  this.processLookupInProviderResult = processLookupInProviderResult;
  this.loadingFeedbackMessage = loadingFeedbackMessage;
  this.lookupVideoInProvider = lookupVideoInProvider;
  this.shouldRenderVideoPlayer = shouldRenderVideoPlayer;
  this.prepareSearch = prepareSearch;
  this.processSearchResults = processSearchResults;
  this.widgetPlayerDirective = 'cf-ooyala-player';

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
        duration: i.duration,
        name: i.name,
        playerId: i.player_id,
        thumbnailUrl: i.preview_image_url
      };
    });
  }
}]);
