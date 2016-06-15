'use strict';

angular.module('contentful')
.directive('cfOnboardingPersonaSelection', function () {
  return {
    restrict: 'E',
    template: JST['onboarding_persona_selection'](),
    controller: 'OnboardingPersonaController',
    controllerAs: 'personaController'
  };
})
.controller('OnboardingPersonaController', ['$scope', '$attrs', 'require', function ($scope, $attrs, require) {
  var analytics = require('analyticsEvents');
  var controller = this;

  // Should the space creation step be shown?
  $attrs.$observe('showCreateSpace', function (showCreateSpace) {
    controller.showCreateSpace = showCreateSpace === 'true';
  });

  // Get the preset persona options
  controller.personaOptions = getPersonaOptions();

  // User clicks an option
  controller.selectOption = function (opt) {
    controller.selectedPersona = opt;
  };

  controller.skipSelection = function () {
    analytics.persona.trackSkipped();
    $scope.$emit('skipPersonaSelection');
  };

  controller.submitPersonaSelection = function (personaSelected) {
    analytics.persona.trackSelected(personaSelected);
    $scope.$emit('submitPersonaSelection');
  };

  function getPersonaOptions () {
    return {
      code: {
        title: 'I write code',
        description: 'Developers, technical PMs, CTOs',
        svg: 'onboarding-persona-code'
      },
      content: {
        title: 'I work with content',
        description: 'Marketers, editors, content strategists',
        svg: 'onboarding-persona-content'
      },
      project: {
        title: 'I manage projects',
        description: 'Product/project managers',
        svg: 'onboarding-persona-project'
      },
      other: {
        title: 'Other',
        description: 'An astronaut? That\'s fine as well.',
        svg: 'onboarding-persona-question-mark'
      }
    };
  }
}]);
