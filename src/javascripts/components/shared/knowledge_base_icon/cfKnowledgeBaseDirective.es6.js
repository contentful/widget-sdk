import { registerDirective } from 'NgRegistry.es6';

export default function register() {
  // TODO: should use transclusion
  // e.g. <cf-knowledge-base target="roles">text to be displayed</cf-knowlege-base>

  registerDirective('cfKnowledgeBase', [
    'components/shared/knowledge_base_icon/KnowledgeBase.es6',
    ({ default: KnowledgeBaseComponent }) => ({
      restrict: 'E',
      template: '<cf-component-bridge component="component" />',
      scope: {
        text: '@',
        target: '@',
        inlineText: '@',
        cssClass: '@'
      },
      controller: [
        '$scope',
        $scope => {
          $scope.component = KnowledgeBaseComponent({
            target: $scope.target,
            text: $scope.text,
            inlineText: $scope.inlineText,
            cssClass: $scope.cssClass
          });
        }
      ]
    })
  ]);
}
