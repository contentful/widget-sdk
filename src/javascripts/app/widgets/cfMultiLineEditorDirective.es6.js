import { registerDirective } from 'NgRegistry.es6';
import { textarea as createTextarea } from '@contentful/field-editors';

export default function register() {
  registerDirective('cfMultiLineEditor', () => ({
    restrict: 'E',
    scope: {},
    require: '^cfWidgetApi',
    link: function($scope, $el, _$attrs, widgetApi) {
      const editor = createTextarea(widgetApi);
      $el.append(editor);

      // This is necessary to free the component for garbage collection.
      // Otherwise the component is kept in a cache somewhere.
      $scope.$on('$destroy', () => {
        $el.empty();
      });
    }
  }));
}
