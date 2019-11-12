import { createFieldApi } from './createFieldApi';
import checkDependencies from 'widgets/bridges/checkDependencies';

/**
 * @typedef { import("contentful-ui-extensions-sdk").FieldAPI } FieldAPI
 */

/**
 * This widgetApi implementation is a one-to-one map with actual `ui-extension-sdk` API, so all components that are using this API
 * can be developed as extensions first and then moved to the webapp without any changes.
 *
 * Eventually it supposed to be the only implementation of `widgetAPI`.
 *
 * Note: This deprecates the old `cfWidgetApi` directive and `WidgetAPi/buildWidgetApi`
 *
 * @param {{ $scope: Object }}
 * @returns {{ field: FieldAPI }}
 */
export default function createNewWidgetApi(dependencies) {
  checkDependencies('createNewWidgetApi', dependencies, ['$scope']);

  const { $scope } = dependencies;

  const field = createFieldApi({ $scope });
  const parameters = {
    installation: {},
    instance: $scope.widget.settings || {}
  };

  return {
    field,
    parameters
  };
}
