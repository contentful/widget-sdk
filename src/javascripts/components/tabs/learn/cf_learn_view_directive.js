'use strict';

angular.module('contentful')

.directive('cfLearnView', function() {
  return {
    template: JST.cf_learn_view(),
    restrict: 'E',
    scope: true,
    controller: 'cfLearnViewController',
    controllerAs: 'learn'
  };
})

.controller('cfLearnViewController', ['$scope', '$injector', '$element', function($scope, $injector, $element) {

  // Onboarding steps
  var controller      = this;
  var spaceContext    = $injector.get('spaceContext');
  var stateParams     = $injector.get('$stateParams');
  var accessChecker   = $injector.get('accessChecker');
  var $state          = $injector.get('$state');
  var analytics       = $injector.get('analytics');
  var sdkInfoProvider = $injector.get('sdkInfoProvider');

  var visibility = accessChecker.getSectionVisibility();

  controller.canAccessContentTypes = visibility.contentType &&
                                     !accessChecker.shouldDisable('createContentType');
  controller.canAccessEntries      = visibility.entry;
  controller.canAccessApiKeys      = visibility.apiKey;

  controller.spaceId = stateParams.spaceId;

  function initLearnPage() {
    spaceContext.refreshContentTypes().then(function() {
      var cts = spaceContext.getFilteredAndSortedContentTypes();

      controller.allContentTypes = cts;
      controller.accessibleContentTypes = _.filter(cts || [], function (ct) {
        var check = _.partialRight(accessChecker.canPerformActionOnEntryOfType, ct.getId());
        return _.every(['create', 'edit'], check);
      });
      controller.hasContentTypes = !!cts.length;
      controller.hasAccessibleContentTypes = !!controller.accessibleContentTypes.length;

      if (controller.hasAccessibleContentTypes) {
        spaceContext.space.getEntries()
        .then(handleEntries)
        .catch(handleEntries.bind(null, []));
      } else {
        handleEntries([]);
      }

      function handleEntries(entries) {
        controller.hasEntries = !!entries.length;
        $scope.context.ready = true;
      }

    }).catch(function() {
      $scope.context.ready = true;
    });
  }

  initLearnPage();
  // Refresh after onboarding as content types and entries might have been created
  $scope.$on('cfAfterOnboarding', initLearnPage);

  // Clicking `Use the API` goes to the delivery API key if there is exactly
  // one otherwise API home
  var apiKeyState = {
    name: 'spaces.detail.api.home'
  };

  spaceContext.space.getDeliveryApiKeys()
  .then(function(keys) {
    if (keys.length === 1) {
      apiKeyState.name = 'spaces.detail.api.keys.detail';
      apiKeyState.params = { apiKeyId: keys[0].data.sys.id };
    }
  });

  controller.goToApiKeySection = function() {
    controller.trackClickedButton('Use the API');
    $state.go(apiKeyState.name, apiKeyState.params);
  };

  // Languages and SDKs
  controller.selectLanguage = function(language) {
    if (!controller.selectedLanguage) {
      // Scroll to the bottom of the page
      var container = $element.find('.workbench-main');
      container.animate({scrollTop: container.scrollTop() + 260}, 'linear');
    }

    controller.selectedLanguage = language;

    analytics.track('Selected Language at the Dashboard', {
      language: controller.selectedLanguage.name
    });
  };

  var documentationList = ['documentation', 'apidemo', 'deliveryApi'];
  controller.languageData = sdkInfoProvider.get(documentationList);
  controller.trackClickedButton = function(name) {
    var eventName = 'Clicked the \'' + name + '\' button from Learn';
    analytics.track(eventName);
  };

  controller.trackResourceLink = function(linkName, language) {
    analytics.track('Selected Content at the Dashboard', {
      resource: linkName,
      language: language
    });
  };
}]);
