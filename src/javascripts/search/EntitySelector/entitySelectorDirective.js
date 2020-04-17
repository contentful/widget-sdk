import { registerDirective } from 'core/NgRegistry';
import entitySelectorTemplate from './entity_selector.html';

export default function register() {
  /**
   * @ngdoc directive
   * @name cfEntitySelector
   * @description
   * Allows to search and select entities (entries, assets, users).
   */
  registerDirective('cfEntitySelector', () => ({
    template: entitySelectorTemplate,
    restrict: 'E',
    scope: {
      config: '=',
      labels: '=',
      listHeight: '=',
      onChange: '=',
      onNoEntities: '=',
    },
    controller: [
      '$scope',
      (_$scope) => {
        // TODO: Move `entity_selector_controller.js` code in here.
      },
    ],
  }));
}
