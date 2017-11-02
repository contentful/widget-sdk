'use strict';

// TODO: should use transclusion
// e.g. <cf-knowledge-base target="roles">text to be displayed</cf-knowlege-base>

angular.module('contentful').directive('cfKnowledgeBase', ['$injector', function ($injector) {
  var KnowledgeBaseComponent = $injector.get('components/shared/knowledge_base_icon/KnowledgeBase').default;

  return {
    restrict: 'E',
    template: '<cf-component-bridge component="component" />',
    scope: {
      text: '@',
      target: '@',
      inlineText: '@',
      cssClass: '@'
    },
    controller: ['$scope', function ($scope) {
      $scope.component = KnowledgeBaseComponent({
        target: $scope.target,
        text: $scope.text,
        inlineText: $scope.inlineText,
        cssClass: $scope.cssClass
      });
    }]
  };
}]);
