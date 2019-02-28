import * as K from 'utils/kefir.es6';
import { truncate } from 'utils/StringUtils.es6';
import { constant, keys, once } from 'lodash';

import { user$ } from 'services/TokenStore.es6';

import * as Validator from './Validator.es6';
import * as Focus from './Focus.es6';
import initDocErrorHandler from './DocumentErrorHandler.es6';
import { makeNotify } from './Notifications.es6';
import installTracking, { trackEntryView } from './Tracking.es6';
import {
  isLinkField,
  getRenderableLinkFieldInstanceCount
} from 'app/entity_editor/LoadEventTracker.es6';

import { getModule } from 'NgRegistry.es6';
import createEntrySidebarProps from 'app/EntrySidebar/EntitySidebarBridge.es6';
import * as logger from 'services/logger.es6';

const $controller = getModule('$controller');
const spaceContext = getModule('spaceContext');
const localeStore = getModule('TheLocaleStore');
const DataFields = getModule('EntityEditor/DataFields');

/**
 * @ngdoc type
 * @name EntryEditorController
 * @description
 * Main controller for the entry editor that is exposed as
 * `editorContext`.
 *
 * The scope properties this controller depends on are provided by the
 * entry state controller.
 *
 * This controller can be mocked with the `mocks/entryEditor/Context`
 * service.
 *
 * TODO this controller shares a lot of code with the
 * AssetEditorController.
 *
 * TODO instead of exposing the sub-controllers on the scope we should
 * expose them on this controller.
 *
 * @param {Object} $scope
 * @param {Object} editorData
 * @param {boolean} preferences.hasInitialFocus
 * @param {boolean} preferences.showDisabledFields
 * @param {boolean} preferences.showAuxPanel
 * @param {function} preferences.toggleAuxPanel
 * @scope.requires {Data.FieldControl[]} formControls
 *   Passed to FormWidgetsController to render field controls
 */
export default async function create($scope, editorData, preferences, trackLoadEvent) {
  $scope.context = {};

  let loadLinksRendered = false;
  let loadShareJSConnected = false;

  $scope.loadEvents = K.createStreamBus($scope);

  const linkFieldTypes = editorData.contentType.data.fields.filter(isLinkField);
  const renderableLinkFieldInstanceCount = getRenderableLinkFieldInstanceCount(linkFieldTypes);

  $scope.context.ready = true;
  $scope.editorData = editorData;

  const editorContext = ($scope.editorContext = {});
  const entityInfo = (editorContext.entityInfo = editorData.entityInfo);

  const notify = makeNotify('Entry', () => '“' + $scope.title + '”');

  $scope.entityInfo = entityInfo;

  const doc = editorData.openDoc(K.scopeLifeline($scope));
  // TODO rename the scope property
  $scope.otDoc = doc;

  initDocErrorHandler($scope, doc.state.error$);

  K.onValueScope($scope, doc.state.isConnected$, status => {
    if (loadShareJSConnected || status === false) {
      return;
    }
    trackLoadEvent('sharejs_connected');

    loadShareJSConnected = true;
    if (loadLinksRendered) {
      trackLoadEvent('fully_interactive');
    }
  });

  K.onValueScope($scope, doc.status$, status => {
    $scope.statusNotificationProps = { status, entityLabel: 'entry' };
  });

  installTracking(entityInfo, doc, K.scopeLifeline($scope));
  try {
    const slideCount = keys($scope.slideStates).length;
    trackEntryView({
      editorData,
      entityInfo,
      currentSlideLevel: slideCount,
      locale: localeStore.getDefaultLocale().internal_code,
      editorType: slideCount > 1 ? 'slide_in_editor' : 'entry_editor'
    });
  } catch (error) {
    logger.logError(error);
  }

  let fieldsInteractiveCount = 0;
  const emit = once(() => {
    trackLoadEvent('links_rendered');
    loadLinksRendered = true;
    if (loadShareJSConnected) {
      trackLoadEvent('fully_interactive');
    }
  });

  if (renderableLinkFieldInstanceCount === 0) {
    emit();
  }

  $scope.loadEvents.stream.onValue(({ actionName }) => {
    if (actionName !== 'linksRendered') {
      return;
    }
    fieldsInteractiveCount++;
    if (fieldsInteractiveCount === renderableLinkFieldInstanceCount) {
      emit();
    }
  });

  editorContext.validator = Validator.createForEntry(
    entityInfo.contentType,
    $scope.otDoc,
    spaceContext.publishedCTs,
    localeStore.getPrivateLocales()
  );

  $scope.state = $controller('entityEditor/StateController', {
    $scope,
    entity: editorData.entity,
    notify,
    validator: editorContext.validator,
    otDoc: $scope.otDoc
  });

  $scope.actions = $controller('EntryActionsController', {
    $scope,
    notify,
    fields$: doc.valuePropertyAt(['fields']),
    entityInfo,
    preferences
  });

  editorContext.focus = Focus.create();

  // TODO Move this into a separate function
  K.onValueScope($scope, doc.valuePropertyAt([]), data => {
    const title = spaceContext.entryTitle({
      getContentTypeId: constant(entityInfo.contentTypeId),
      data
    });
    $scope.context.title = title;
    $scope.title = truncate(title, 50);
  });

  $scope.user = K.getValue(user$);

  editorContext.hasInitialFocus = preferences.hasInitialFocus;

  K.onValueScope($scope, $scope.otDoc.state.isDirty$, isDirty => {
    $scope.context.dirty = isDirty;
  });

  // Building the form
  $controller('FormWidgetsController', {
    $scope,
    controls: editorData.fieldControls.form
  });

  /**
   * Build the `entry.fields` api of the widget-sdk at one
   * place and put it on $scope so that we don't rebuild it
   * for every widget. Instead, we share this version in every
   * cfWidgetApi instance.
   */
  $scope.fields = DataFields.create(editorData.contentType.fields, $scope.otDoc);

  $scope.entrySidebarProps = createEntrySidebarProps({
    $scope
  });
}
