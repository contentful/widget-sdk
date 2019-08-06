import { createFieldApi } from './createFieldApi.es6';
import checkDependencies from 'widgets/bridges/checkDependencies.es6';

/**
 * @typedef { import("contentful-ui-extensions-sdk").FieldAPI } FieldAPI
 */

/**
 * This widgetApi implementation is a one-to-one map with actual `ui-extension-sdk` API, so all components that are using this API
 * can be developed as extensions first and then moved to the webapp without any changes.
 *
 * Eventually it supposed to be the only implementation of `widgetAPI`.
 *
 * Note: This deprecates the old `cfWidgetApi` directive and `WidgetAPi/buildWidgetApi.es6`
 *
 * @param {{ $scope: Object }}
 * @returns {{ field: FieldAPI }}
 */
export default function createNewWidgetApi(dependencies) {
  checkDependencies('createNewWidgetApi', dependencies, ['$scope']);

  const { $scope } = dependencies;

  const field = createFieldApi({ $scope });

  return {
    field
  };
}
