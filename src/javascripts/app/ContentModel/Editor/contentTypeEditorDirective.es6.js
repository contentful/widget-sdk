import { registerDirective } from 'NgRegistry.es6';
import contentModelEditorTemplate from 'app/ContentModel/Editor/Template.es6';

export default function register() {
  registerDirective('cfContentTypeEditor', [
    '$timeout',
    $timeout => ({
      template: contentModelEditorTemplate,
      restrict: 'A',
      controller: 'ContentTypeEditorController',
      controllerAs: 'ctEditorController',
      link: function(scope, element) {
        scope.$on('fieldAdded', scroll);

        function scroll() {
          const fieldList = element.find('[ng-model="contentType.data.fields"]');

          // This method only works on jQuery objects containing
          // one element: https://api.jqueryui.com/scrollParent/
          if (fieldList.length !== 1) {
            return;
          }

          // We need a timeout here for a newly added field
          // to be rendered; otherwise we get the old height
          $timeout(() => {
            const height = fieldList.height();
            fieldList.scrollParent().scrollTop(height);
          });
        }
      }
    })
  ]);
}
