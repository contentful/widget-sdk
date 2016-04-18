'use strict';

angular.module('contentful')
.directive('cfOnboardingPersonaSelection', function() {
  return {
    restrict: 'E',
    template: JST['onboarding_persona_selection'](),
    controller: 'OnboardingPersonaController',
    controllerAs: 'personaController'
  };
})
.controller('OnboardingPersonaController', ['$scope', '$injector', '$attrs', function($scope, $injector, $attrs) {

  var controller = this;
  var analytics  = $injector.get('analytics');

  // Should the space creation step be shown?
  $attrs.$observe('showCreateSpace', function(showCreateSpace) {
    controller.showCreateSpace = showCreateSpace === 'true';
  });

  // Get the preset persona options
  controller.personaOptions = getPersonaOptions();

  // User clicks an option
  controller.selectOption = function(opt) {
    controller.selectedPersona = opt;
  };

  controller.skipSelection = function() {
    analytics.track('Skipped Persona Selection');
    $scope.$emit('skipPersonaSelection');
  };

  controller.submitPersonaSelection = function(personaSelected) {
    makeSelection({
      personaName: getSegmentName(personaSelected)
    });
    $scope.$emit('submitPersonaSelection');
  };

  function getPersonaOptions() {
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

  function makeSelection(obj) {
    // Remove unnecessary values from object
    var segmentObj = _.pick(obj, hasValue);

    // Add to user data, and track event
    analytics.addIdentifyingData(segmentObj);
    analytics.track('Selected Persona', segmentObj);

    // Returns true if val is a non-empty string, otherwise false
    function hasValue(val) {
      return typeof val === 'string' && val.length;
    }
  }

  function getSegmentName(personaName) {
    var map = {
      code: 'Coder',
      content: 'Content Manager',
      project: 'Project Manager',
      other: 'Other'
    };
    return map[personaName];
  }

}]);

