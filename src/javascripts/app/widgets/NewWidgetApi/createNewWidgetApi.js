import { Notification } from '@contentful/forma-36-react-components';
import { createFieldApi } from './createFieldApi';
import { createNavigatorApi } from './createNavigatorApi';
import { createLocalesApi } from './createLocalesApi';
import { createDialogsApi } from './createDialogsApi';
import { createEntryApi } from './createEntryApi';
import { createSpaceApi } from './createSpaceApi';
import { createContentTypeApi } from './createContentTypeApi';
import checkDependencies from 'widgets/bridges/checkDependencies';

const noop = () => {};

/**
 * @typedef { import("contentful-ui-extensions-sdk").FieldAPI } FieldAPI
 * @typedef { import("contentful-ui-extensions-sdk").WindowAPI } WindowAPI
 * @typedef { import("contentful-ui-extensions-sdk").ParametersAPI } ParametersAPI
 * @typedef { import("contentful-ui-extensions-sdk").NotifierAPI } NotifierAPI
 * @typedef { import("contentful-ui-extensions-sdk").NavigatorAPI } NavigatorAPI
 * @typedef { import("contentful-ui-extensions-sdk").LocalesAPI } LocalesAPI
 * @typedef { import("contentful-ui-extensions-sdk").EntryAPI } EntryAPI
 * @typedef { import("contentful-ui-extensions-sdk").SpaceAPI } SpaceAPI
 * @typedef { import("contentful-ui-extensions-sdk").ContentType } ContentType
 */

/**
 * This widgetApi implementation is a partial map with actual `ui-extension-sdk` API, so all components that are using this API
 * can be developed as extensions first and then moved to the webapp without any changes.
 *
 * Eventually it supposed to be the only implementation of `widgetAPI`.
 *
 * Note: This deprecates the old `cfWidgetApi` directive and `WidgetAPi/buildWidgetApi`
 *
 * @param {{ $scope: Object, spaceContext: Object }}
 * @returns {{
 *  field: FieldAPI,
 *  space: SpaceAPI,
 *  contentType: ContentType,
 *  locales: LocalesAPI,
 *  window: WindowAPI,
 *  entry: EntryAPI,
 *  space: SpaceAPI,
 *  parameters: ParametersAPI,
 *  notifier: NotifierAPI,
 *  navigator: NavigatorAPI
 * }}
 */
export default function createNewWidgetApi(dependencies) {
  checkDependencies('createNewWidgetApi', dependencies, ['$scope', 'spaceContext']);

  const { $scope, spaceContext } = dependencies;

  const field = createFieldApi({ $scope });
  const space = createSpaceApi({ spaceContext });
  const entry = createEntryApi({ $scope });
  const navigator = createNavigatorApi({ spaceContext });
  const locales = createLocalesApi();
  const dialogs = createDialogsApi();
  const contentType = createContentTypeApi({ $scope });

  const parameters = {
    installation: {},
    instance: $scope.widget.settings || {}
  };

  return {
    entry,
    space,
    field,
    contentType,
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
