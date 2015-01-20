'use strict';

angular.module('contentful').value('OoyalaErrorMessages', {
  missingCredentials      : 'Missing or invalid Ooyala credentials. Please check your organizational settings or contact our support',
  invalidAssetID          : 'Cannot load the video. Please check the content id',
  playerFailedToLoad      : 'Cannot load the player. Please reload the page',
  playerFailedToPlayVideo : 'Cannot play the video. Please reload the page',
  unknownError            : 'Cannot play the video. Please reload the page'
});
