import { Notification } from '@contentful/forma-36-react-components';
import { createFieldApi } from './createFieldApi';
import { createNavigatorApi } from './createNavigatorApi';
import { createLocalesApi } from './createLocalesApi';
import { createDialogsApi } from './createDialogsApi';
import checkDependencies from 'widgets/bridges/checkDependencies';

const noop = () => {};

/**
 * @typedef { import("contentful-ui-extensions-sdk").FieldAPI } FieldAPI
 * @typedef { import("contentful-ui-extensions-sdk").WindowAPI } WindowAPI
 * @typedef { import("contentful-ui-extensions-sdk").ParametersAPI } ParametersAPI
 * @typedef { import("contentful-ui-extensions-sdk").NotifierAPI } NotifierAPI
 * @typedef { import("contentful-ui-extensions-sdk").NavigatorAPI } NavigatorAPI
 * @typedef { import("contentful-ui-extensions-sdk").LocalesAPI } LocalesAPI
 */

/**
 * This widgetApi implementation is a one-to-one map with actual `ui-extension-sdk` API, so all components that are using this API
 * can be developed as extensions first and then moved to the webapp without any changes.
 *
 * Eventually it supposed to be the only implementation of `widgetAPI`.
 *
 * Note: This deprecates the old `cfWidgetApi` directive and `WidgetAPi/buildWidgetApi`
 *
 * @param {{ $scope: Object, spaceContext: Object }}
 * @returns {{
 *  field: FieldAPI,
 *  locales: LocalesAPI,
 *  window: WindowAPI,
 *  parameters: ParametersAPI,
 *  notifier: NotifierAPI,
 *  navigator: NavigatorAPI
 * }}
 */
export default function createNewWidgetApi(dependencies) {
  checkDependencies('createNewWidgetApi', dependencies, ['$scope', 'spaceContext']);

  const { $scope, spaceContext } = dependencies;

  const field = createFieldApi({ $scope });
  const navigator = createNavigatorApi({ spaceContext });
  const locales = createLocalesApi();
  const dialogs = createDialogsApi();

  const parameters = {
    installation: {},
    instance: $scope.widget.settings || {}
  };

  return {
    field,
    navigator,
    locales,
    dialogs,
    window: {
      updateHeight: noop,
      startAutoResizer: noop,
      stopAutoResizer: noop
    },
    notifier: {
      success: text => {
        Notification.success(text);
      },
      error: text => {
        Notification.error(text);
      }
    },
    parameters
  };
}
