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
  var TheStore   = $injector.get('TheStore');

  // Should the space creation step be shown?
  $attrs.$observe('showCreateSpace', function(showCreateSpace) {
    controller.showCreateSpace = showCreateSpace === 'true';
  });

  // Get the preset persona options
  controller.personaOptions = getPersonaOptions();

  // User clicks an option
  controller.selectOption = function(opt) {
    controller.selectedPersona = opt;
    if (opt === 'other') {
      controller.showOtherText = true;
    }
  };

  // Close the `other` option
  controller.closeOtherText = function() {
    controller.showOtherText = false;
    controller.customPersonaName = '';
    controller.selectedPersona = undefined;
  };

  controller.showOtherText = false;

  controller.skipSelection = function() {
    analytics.track('Skipped Persona Selection');
    $scope.$emit('skipPersonaSelection');
    trackSeenStatus();
  };

  controller.submitPersonaSelection = function() {
    makeSelection({
      personaName: getSegmentName(controller.selectedPersona),
      customPersonaName: controller.customPersonaName
    });
    $scope.$emit('submitPersonaSelection');
    trackSeenStatus();
  };

  function getPersonaOptions() {
    return {
      code: {
        title: 'I write code',
        description: 'Developers, Technical PMs, CTOs',
        svg: 'onboarding-persona-code'
      },
      content: {
        title: 'I work with content',
        description: 'Marketers, Editors, Content Strategists',
        svg: 'onboarding-persona-content'
      },
      project: {
        title: 'I manage projects',
        description: 'Product/Project Managers',
        svg: 'onboarding-persona-project'
      },
      other: {
        title: 'Other',
        description: 'An astronaut? Tell us more!',
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

  function trackSeenStatus() {
    TheStore.set('seenOnboarding', true);
  }

}]);

