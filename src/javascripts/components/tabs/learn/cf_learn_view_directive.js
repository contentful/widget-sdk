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
  var moment = require('moment');
  var spaceContext = require('spaceContext');
  var stateParams = require('$stateParams');
  var analytics = require('analytics');
  var sdkInfoSupplier = require('sdkInfoSupplier');
  var WebhookRepository = require('WebhookRepository');

  var activatedAt = spaceContext.getData('activatedAt');

  controller.spaceId = stateParams.spaceId;

  function initLearnPage () {
    controller.contentTypes = spaceContext.publishedContentTypes;
    controller.activated = !!activatedAt;
    getEntries().then(function (entries) {
      controller.hasEntries = !!_.size(entries);
      controller.numberStepsCompleted = [
        controller.contentTypes.length,
        controller.hasEntries,
        controller.activated
      ].filter(function (val) {
        return !!val;
      }).length;
    })
    .then(maybeGetSecondPage)
    .finally(showPage);
  }

  function getEntries () {
    if (controller.contentTypes.length) {
      return spaceContext.space.getEntries();
    } else {
      return $q.resolve([]);
    }
  }

  function maybeGetSecondPage () {
    if (controller.numberStepsCompleted === 3) {
      return $q.all([
        spaceContext.space.getUsers(),
        WebhookRepository.getInstance(spaceContext.space).getAll()
      ]).then(setSecondPageSteps);
    }
  }

  function setSecondPageSteps (responses) {
    var hasUsers = responses[0].length > 1;
    var hasLocales = spaceContext.getData('locales').length > 1;
    var hasWebhooks = responses[1].length > 0;

    // Hide the note after one week post-activation
    controller.showNote = moment(activatedAt).add(7, 'days').isAfter(moment());

    controller.secondPageSteps = [
      {
        title: 'Invite users',
        buttonText: 'Invite users',
        linkText: 'View users',
        description: 'Invite your teammates to the space to get your project off the ground.',
        icon: 'learn-add-user',
        sref: 'spaces.detail.settings.users.list',
        completed: hasUsers
      }, {
        title: 'Locales',
        buttonText: 'Add locales',
        linkText: 'View locales',
        description: 'Set up locales to manage and deliver content in different languages.',
        icon: 'learn-locales',
        sref: 'spaces.detail.settings.locales.list',
        completed: hasLocales
      }, {
        title: 'Webhooks',
        buttonText: 'Add webhooks',
        linkText: 'View webhooks',
        description: 'Configure webhooks to send requests triggered by changes to your content.',
        icon: 'learn-webhooks',
        sref: 'spaces.detail.settings.webhooks.list',
        completed: hasWebhooks
      }
    ];
  }

  function showPage () {
    $scope.context.ready = true;
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
