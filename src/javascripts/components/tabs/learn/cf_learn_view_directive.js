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

  controller.canAccessContentTypes = accessChecker.getSectionVisibility().contentType;
  controller.canAccessEntries = accessChecker.getSectionVisibility().entry;
  controller.canAccessApiKeys = accessChecker.getSectionVisibility().apiKey;

  $scope.context.ready = false;

  controller.spaceId = stateParams.spaceId;

  spaceContext.space.getContentTypes()
  .then(function(cts) {
    controller.allContentTypes = cts;
    controller.accessibleContentTypes = _.filter(cts || [], function (ct) {
      return accessChecker.canPerformActionOnEntryOfType('create', ct.getId());
    });
    controller.hasContentTypes = !!cts.length;
    controller.hasAccessibleContentTypes = !!controller.accessibleContentTypes.length;

    if (controller.hasAccessibleContentTypes) {
      spaceContext.space.getEntries()
      .then(function(entries) {
        controller.hasEntries = !!entries.length;
        $scope.context.ready = true;
      });
    } else {
      controller.hasEntries = false;
      $scope.context.ready = true;
    }

  }).catch(function() {
    $scope.context.ready = true;
  });

  // Clicking `Use the API` goes to the delivery API key if there is exactly
  // one otherwise API home
  var apiKeyPath = {
    path: 'spaces.detail.api.home'
  };

  spaceContext.space.getDeliveryApiKeys()
  .then(function(keys) {
    if (keys.length === 1) {
      apiKeyPath.path = 'spaces.detail.api.keys.detail';
      apiKeyPath.params = { apiKeyId: keys[0].data.sys.id };
    }
  });

  controller.goToApiKeySection = function() {
    $state.go(apiKeyPath.path, apiKeyPath.params);
  };

  controller.addAnEntry = function(ctId) {
    $state.go('spaces.detail.entries.detail', {contentTypeId: ctId});
  };

  // Languages and SDKs
  controller.selectIndex = function(idx) {

    if (_.isUndefined(controller.selectedLanguageIndex)) {
      // Scroll to the bottom of the page
      var container = $element.find('.workbench-main');
      container.animate({scrollTop: container.scrollTop() + 260}, 'linear');
    }

    controller.selectedLanguageIndex = idx;
    controller.selectedLanguageName = controller.languageData[idx].name;

  };

  controller.languageData = [
    {name: 'JavaScript', icon: 'language-js'},
    {name: 'PHP', icon: 'language-php'},
    {name: 'Ruby', icon: 'language-ruby'},
    {name: 'iOS', icon: 'language-ios'},
    {name: 'Android', icon: 'language-android'},
    {name: 'HTTP', icon: 'language-http'}
  ];

}]);