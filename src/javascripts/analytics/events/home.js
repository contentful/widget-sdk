'use strict';

angular.module('contentful')

.factory('analyticsEvents/home', ['require', function (require) {
  var analytics = require('analytics');

  return {
    spaceSelected: spaceSelected,
    spaceLearnSelected: spaceLearnSelected,
    selectedLanguage: selectedLanguage,
    linkOpened: linkOpened
  };

  function spaceSelected (space) {
    analytics.track('home:space_selected', {
      targetSpaceId: space.getId(),
      targetSpaceName: space.getName()
    });
  }

  function spaceLearnSelected (space) {
    analytics.track('home:space_learn_selected', {
      targetSpaceId: space.getId(),
      targetSpaceName: space.getName()
    });
  }

  function selectedLanguage (language) {
    analytics.track('home:language_selected', {
      language: language
    });
  }

  function linkOpened (language, url) {
    analytics.track('home:link_opened', {
      language: language,
      url: url
    });
  }
}]);
