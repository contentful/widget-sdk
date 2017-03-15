'use strict';

angular.module('contentful')
.directive('cfOnboardingSteps', ['require', function (require) {
  var OnboardingSteps = require('components/onboarding_steps/OnboardingSteps');

  return {
    template: OnboardingSteps.template(),
    restrict: 'E',
    scope: {},
    controller: function () {
    }
  };
}]);
