import { noop } from 'lodash';
import { getBatchingApiClient } from '../WidgetApi/BatchingApiClient';
import { Notification } from '@contentful/forma-36-react-components';
import { createEntryApi, createReadOnlyEntryApi } from './createEntryApi';
import { createFieldApi, createReadOnlyFieldApi } from './createFieldApi';
import { createNavigatorApi } from './createNavigatorApi';
import { createLocalesApi } from './createLocalesApi';
import { createDialogsApi } from './createDialogsApi';
import { createSpaceApi } from './createSpaceApi';
import { createContentTypeApi } from './createContentTypeApi';
import checkDependencies from 'widgets/bridges/checkDependencies';
import makeExtensionAccessHandlers from 'widgets/bridges/makeExtensionAccessHandlers';

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
 * @typedef { import("contentful-ui-extensions-sdk").AccessAPI } AccessAPI
 */

/**
 * This widgetApi implementation is a partial map with actual `ui-extension-sdk` API, so all components that are using this API
 * can be developed as extensions first and then moved to the webapp without any changes.
 *
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
 *  navigator: NavigatorAPI,
 *  scheduledActions: any,
 *  access: AccessAPI,
 * }}
 */
export default function createNewWidgetApi(dependencies) {
  checkDependencies('createNewWidgetApi', dependencies, ['$scope', 'spaceContext']);
  const { spaceContext, $scope } = dependencies;
  const { cma } = spaceContext;
  const { locale, widget, otDoc } = $scope;
  const { contentType } = $scope.entityInfo;
  const contentTypeApi = createContentTypeApi({ contentType });

  const entry = createEntryApi({ contentType, locale, otDoc });
  const field = createFieldApi({ $scope }); // TODO: Get rid of $scope here, pass actual dependencies.

  const parameters = {
    installation: {},
    instance: widget.settings || {},
  };

  return {
    ...createSpaceScopedWidgetApi({
      cma,
      initialContentTypes: spaceContext.publishedCTs.getAllBare(),
    }),
    contentType: contentTypeApi,
    entry,
    field,
    parameters,
  };
}

export function createNewReadOnlyWidgetApi({
  field,
  fieldValue,
  locale,
  entry,
  contentType,
  cma,
  initialContentTypes,
}) {
  const contentTypeApi = createContentTypeApi({ contentType });
  const entryApi = createReadOnlyEntryApi({ contentType, locale, entry });
  const fieldApi = createReadOnlyFieldApi({ locale, field, value: fieldValue });

  return {
    ...createSpaceScopedWidgetApi({ cma, initialContentTypes }),
    contentType: contentTypeApi,
    entry: entryApi,
    field: fieldApi,
  };
}

function createSpaceScopedWidgetApi({ cma: cmaOrBatchingApiClient, initialContentTypes }) {
  const cma = getBatchingApiClient(cmaOrBatchingApiClient);
  const space = createSpaceApi({ cma, initialContentTypes });
  const navigator = createNavigatorApi({ cma });
  const locales = createLocalesApi();
  const dialogs = createDialogsApi();
  const canAccess = makeExtensionAccessHandlers();

  return {
    space,
    navigator,
    locales,
    dialogs,
    window: {
      updateHeight: noop,
      startAutoResizer: noop,
      stopAutoResizer: noop,
    },
    notifier: {
      success: (text) => {
        Notification.success(text);
      },
      error: (text) => {
        Notification.error(text);
      },
    },
    parameters: {
      installation: {},
      instance: {},
    },
    access: {
      can: (...args) => {
        const result = canAccess(...args);
        return Promise.resolve(result);
      },
    },
  };
}
