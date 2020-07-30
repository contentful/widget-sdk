import { noop } from 'lodash';
import { getBatchingApiClient } from '../WidgetApi/BatchingApiClient';
import { Notification } from '@contentful/forma-36-react-components';
import { createNavigatorApi } from './createNavigatorApi';
import { createLocalesApi } from './createLocalesApi';
import { createDialogsApi } from './createDialogsApi';
import { createSpaceApi } from './createSpaceApi';
import { createContentTypeApi } from './createContentTypeApi';
import makeExtensionAccessHandlers from 'widgets/bridges/makeExtensionAccessHandlers';
import { createTagsRepo } from 'features/content-tags';
import { createUserApi } from './createUserApi';
import { createIdsApi } from './createIdsApi';
import { createEntryApi } from './createEntryApi';
import { FieldExtensionSDK, DialogExtensionSDK, DialogsAPI } from 'contentful-ui-extensions-sdk';

export function createFieldWidgetSDK({
  spaceContext,
  $scope,
  widgetNamespace,
  widgetId,
}): FieldExtensionSDK {
  const { widget, otDoc, locale } = $scope;
  const { contentType: internalContentType } = $scope.entityInfo;
  const { editorInterface } = $scope.editorData;
  const contentType = createContentTypeApi(internalContentType);
  const environmentIds = [spaceContext.getEnvironmentId(), ...spaceContext.getAliasesIds()];
  const tagsRepo = createTagsRepo(spaceContext.endpoint, spaceContext.getEnvironmentId());

  const entry = createEntryApi({ internalContentType, otDoc, $scope });
  const field = entry.fields[widget.fieldId].getForLocale(locale.code);
  const user = createUserApi(spaceContext.space.data.spaceMember);
  const ids = createIdsApi(
    spaceContext.getId(),
    environmentIds[0],
    contentType,
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

  const cma = getBatchingApiClient(spaceContext.cma);
  const space = createSpaceApi({
    cma,
    initialContentTypes: spaceContext.publishedCTs.getAllBare(),
    pubSubClient: spaceContext.pubsubClient,
    environmentIds,
    spaceId: spaceContext.getId(),
    tagsRepo,
    usersRepo: spaceContext.users,
  });
  const navigator = createNavigatorApi({ cma, spaceContext, widget });
  const locales = createLocalesApi();
  const canAccess = makeExtensionAccessHandlers();

  const apis: FieldExtensionSDK = {
    space,
    navigator,
    locales,
    entry,
    field,
    user,
    ids,
    parameters,
    contentType,
    location: {
      is: (_type: string) => true, // TODO: figure out how to determine current location here
    },
    window: {
      // There are no iframes in the internal API so any methods related
      // to <iframe> height can be safely ignored.
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
    access: {
      can: (action: string, entity: any) => {
        return Promise.resolve(canAccess(action, entity));
      },
    },

    // TODO: extract to a module and implement!
    editor: {
      editorInterface,
      onLocaleSettingsChanged: () => () => {},
      onShowDisabledFieldsChanged: () => () => {},
    },

    // Hack starts here
    dialogs: ({} as unknown) as DialogsAPI,
  };

  // Not a mistake
  // We want to manipulate the apis object (passed as reference) so that DialogsAPI can self reference
  // and we can open/close a dialog from a dialog (INCEPTION HORN)
  const dialogs = createDialogsApi((apis as unknown) as DialogExtensionSDK);
  apis.dialogs = dialogs;
  // Hack ends here

  return apis;
}

// TODO: sync with regular API and make sure it's really read only,
// including CMA operations via the space API
export function createReadonlyFieldWidgetSDK({
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
