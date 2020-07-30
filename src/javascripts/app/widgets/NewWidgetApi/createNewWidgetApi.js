import { noop } from 'lodash';
import { getBatchingApiClient } from '../WidgetApi/BatchingApiClient';
import { Notification } from '@contentful/forma-36-react-components';
import { createNavigatorApi } from './createNavigatorApi';
import { createLocalesApi } from './createLocalesApi';
import { createDialogsApi } from './createDialogsApi';
import { createSpaceApi } from './createSpaceApi';
import { createContentTypeApi } from './createContentTypeApi';
import checkDependencies from 'widgets/bridges/checkDependencies';
import makeExtensionAccessHandlers from 'widgets/bridges/makeExtensionAccessHandlers';
import { createTagsRepo } from 'features/content-tags';
import { createUserApi } from './createUserApi';
import { createIdsApi } from './createIdsApi';
import { createEntryApi } from './createEntryApi';

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
  checkDependencies('createNewWidgetApi', dependencies, [
    '$scope',
    'spaceContext',
    'widgetNamespace',
    'widgetId',
  ]);
  const { spaceContext, $scope, widgetNamespace, widgetId } = dependencies;
  const { cma } = spaceContext;
  const { widget, otDoc, locale } = $scope;
  const { contentType } = $scope.entityInfo;
  const { editorInterface } = $scope.editorData;
  const contentTypeApi = createContentTypeApi(contentType);
  const environmentIds = [spaceContext.getEnvironmentId(), ...spaceContext.getAliasesIds()];
  const tagsRepo = createTagsRepo(spaceContext.endpoint, spaceContext.getEnvironmentId());

  const entry = createEntryApi({ contentType, otDoc, $scope });
  const field = entry.fields[widget.fieldId].getForLocale(locale.code);
  const user = createUserApi(spaceContext.space.data.spaceMember);
  const ids = createIdsApi(
    spaceContext.getId(),
    environmentIds[0],
    contentTypeApi,
    entry,
    field,
    user,
    widgetNamespace,
    widgetId
  );

  const parameters = {
    installation: {},
    instance: widget.settings || {},
  };

  return {
    ...createSpaceScopedWidgetApi({
      cma,
      initialContentTypes: spaceContext.publishedCTs.getAllBare(),
      pubSubClient: spaceContext.pubsubClient,
      environmentIds,
      tagsRepo,
      usersRepo: spaceContext.users,
      spaceId: spaceContext.getId(),
      spaceContext,
      widget,
    }),
    contentType: contentTypeApi,
    editor: {
      editorInterface,
      onLocaleSettingsChanged: () => () => {},
      onShowDisabledFieldsChanged: () => () => {},
    },
    entry,
    field,
    parameters,
    user,
    ids,
  };
}

// TODO: sync with regular API and make sure it's really read only,
// including CMA operations via the space API
export function createNewReadOnlyWidgetApi({
  _field,
  _fieldValue,
  _locale,
  _entry,
  _contentType,
  _cma,
  _initialContentTypes,
}) {
  return {};
}

function createSpaceScopedWidgetApi({
  cma: cmaOrBatchingApiClient,
  initialContentTypes,
  pubSubClient,
  environmentIds,
  tagsRepo,
  usersRepo,
  spaceId,
  spaceContext,
  widget,
}) {
  const cma = getBatchingApiClient(cmaOrBatchingApiClient);
  const space = createSpaceApi({
    cma,
    initialContentTypes,
    pubSubClient,
    environmentIds,
    spaceId,
    tagsRepo,
    usersRepo,
  });
  const navigator = createNavigatorApi({ cma, spaceContext, widget });
  const locales = createLocalesApi();
  const canAccess = makeExtensionAccessHandlers();

  const apis = {
    space,
    navigator,
    locales,
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

  // Not a mistake
  // We want to manipulate the apis object (passed as reference) so that DialogsAPI can self reference
  // and we can open/close a dialog from a dialog (INCEPTION HORN)
  const dialogs = createDialogsApi(apis);
  apis.dialogs = dialogs;

  return apis;
}
