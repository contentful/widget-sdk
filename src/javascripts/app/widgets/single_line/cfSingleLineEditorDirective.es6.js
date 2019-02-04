import { registerDirective } from 'NgRegistry.es6';
import * as Editors from '@contentful/field-editors';

export default function register() {
  registerDirective('cfSingleLineEditor', () => ({
    scope: {},
    require: '^cfWidgetApi',
    restrict: 'E',
    link: function($scope, $el, _attributes, widgetApi) {
      const editor = Editors.textInput(widgetApi);
      $el.append(editor);

      // This is necessary to free the component for garbage collection.
      // Otherwise the component is kept in a cache somewhere.
      $scope.$on('$destroy', () => {
        $el.empty();
      });
    }
  }));
}
