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

.controller('cfLearnViewController', ['$scope', '$injector', function($scope, $injector) {

  // Onboarding steps
  var controller = this;
  var spaceContext = $injector.get('spaceContext');
  var stateParams = $injector.get('$stateParams');
  var accessChecker = $injector.get('accessChecker');

  controller.canAccessContentTypes = accessChecker.getSectionVisibility().contentType;
  controller.canAccessEntries = accessChecker.getSectionVisibility().entry;
  controller.canAccessApiKeys = accessChecker.getSectionVisibility().apiKey;

  $scope.context.ready = false;

  controller.spaceId = stateParams.spaceId;

  spaceContext.space.getContentTypes()
  .then(function(contentTypes) {
    controller.hasContentTypes = !!contentTypes.total;

    if (controller.hasContentTypes) {
      spaceContext.space.getEntries()
      .then(function(entries) {
        controller.hasEntries = !!entries.total;
        $scope.context.ready = true;
      });
    } else {
      controller.hasEntries = false;
      $scope.context.ready = true;
    }

  }).catch(function() {
    $scope.context.ready = true;
  });

  // Languages and SDKs
  controller.selectIndex = function(idx) {
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

  controller.selectIndex(0);


}]);