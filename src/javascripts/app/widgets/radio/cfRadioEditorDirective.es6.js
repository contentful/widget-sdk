import { registerDirective } from 'NgRegistry.es6';
import * as random from 'utils/Random.es6';
import * as selectionController from 'app/widgets/selectionController.es6';

export default function register() {
  /**
   * @ngdoc directive
   * @module cf.app
   * @name cfRadioEditor
   */
  registerDirective('cfRadioEditor', () => ({
    restrict: 'E',
    scope: {},
    template: JST['cf_radio_editor'](),
    require: '^cfWidgetApi',
    link: function(scope, _elem, _attrs, widgetApi) {
      selectionController.createFromValidations(widgetApi, scope);

      const field = widgetApi.field;
      scope.radioGroupName = ['entity', field.id, field.locale, random.letter(5)].join('.');
    }
  }));
}
