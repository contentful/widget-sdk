'use strict';

angular.module('contentful')
.controller('OnboardingDialogController', ['$scope', '$injector', function ($scope, $injector) {

  var controller    = this;
  var accessChecker = $injector.get('accessChecker');
  var spaceContext  = $injector.get('spaceContext');

  controller.currentStep = 1;

  // Show both onboarding steps only if user can create space and has none yet
  if (accessChecker.canCreateSpace() && !spaceContext.space) {
    // Show space creation
    controller.showCreateSpace = true;
    $scope.$on('submitPersonaSelection', gotoNextStep);
    $scope.$on('skipPersonaSelection', gotoNextStep);
  } else {
    // Do not show space creation
    controller.showCreateSpace = false;
    $scope.$on('submitPersonaSelection', confirmDialog);
    $scope.$on('skipPersonaSelection', cancelDialog);
  }

  function confirmDialog() {
    $scope.dialog.confirm();
  }

  function cancelDialog() {
    $scope.dialog.cancel();
  }

  function gotoNextStep() {
    controller.currentStep += 1;
  }

}]);
