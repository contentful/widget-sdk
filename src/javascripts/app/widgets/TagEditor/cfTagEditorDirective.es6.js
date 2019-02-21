import { registerDirective } from 'NgRegistry.es6';
import _ from 'lodash';

export default function register() {
  /**
   * @ngdoc directive
   * @module cf.app
   * @name cfTagEditor
   */
  registerDirective('cfTagEditor', () => ({
    restrict: 'E',
    scope: {},
    require: '^cfWidgetApi',
    template:
      '<react-component name="app/widgets/TagEditor/TagEditorField.es6" props="props"></react-component>',
    link: function($scope, _el, _attrs, widgetApi) {
      $scope.props = {
        field: widgetApi.field
      };
    }
  }));
}
