'use strict';

angular.module('contentful')

.directive('cfLearnView', function () {
  return {
    template: JST.cf_learn_view(),
    restrict: 'E',
    scope: true,
    controller: 'cfLearnViewController',
    controllerAs: 'learn'
  };
})

.controller('cfLearnViewController', ['$scope', 'require', '$element',
function ($scope, require, $element) {

  var controller = this;
  var $q = require('$q');
  var $state = require('$state');
  var spaceContext = require('spaceContext');
  var stateParams = require('$stateParams');
  var analytics = require('analytics');
  var sdkInfoSupplier = require('sdkInfoSupplier');

  controller.spaceId = stateParams.spaceId;
  controller.activated = !!spaceContext.getData('activatedAt');

  function initLearnPage () {
    controller.contentTypes = spaceContext.publishedContentTypes;

    getEntries().then(function (entries) {
      controller.hasEntries = !!_.size(entries);
    })
    .finally(function () {
      $scope.context.ready = true;
    });
  }

  function getEntries () {
    if (controller.contentTypes.length) {
      return spaceContext.space.getEntries();
    } else {
      return $q.resolve([]);
    }
  }

  initLearnPage();
  // Refresh after onboarding as content types and entries might have been created
  $scope.$on('cfAfterOnboarding', initLearnPage);

  // Clicking `Use the API` goes to the delivery API key if there is exactly
  // one otherwise API home
  controller.goToApiKeySection = function () {
    controller.trackClickedButton('Use the API');
    spaceContext.space.getDeliveryApiKeys()
    .then(function (keys) {
      if (keys.length === 1) {
        var name = 'spaces.detail.api.keys.detail';
        var params = { apiKeyId: keys[0].data.sys.id };
        $state.go(name, params);
      } else {
        $state.go('spaces.detail.api.home');
      }
    });
  };

  // Languages and SDKs
  controller.selectLanguage = function (language) {
    if (!controller.selectedLanguage) {
      // Scroll to the bottom of the page
      var container = $element.find('.workbench-main');
      container.animate({scrollTop: container.scrollTop() + 260}, 'linear');
    }

    if (controller.selectedLanguage === language) {
      controller.selectedLanguage = undefined;
    } else {
      controller.selectedLanguage = language;
      analytics.track('Selected Language at the Dashboard', {
        language: controller.selectedLanguage.name
      });
    }
  };

  var documentationList = ['documentation', 'apidemo', 'deliveryApi'];
  controller.languageData = sdkInfoSupplier.get(documentationList);
  controller.trackClickedButton = function (name) {
    var eventName = 'Clicked the \'' + name + '\' button from Learn';
    analytics.track(eventName);
  };

  controller.trackResourceLink = function (linkName, language) {
    analytics.track('Selected Content at the Dashboard', {
      resource: linkName,
      language: language
    });
  };
}]);
