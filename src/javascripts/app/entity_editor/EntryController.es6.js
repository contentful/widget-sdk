import * as K from 'utils/kefir.es6';
import { truncate } from 'utils/StringUtils.es6';
import { constant } from 'lodash';

import contextHistory from 'navigation/Breadcrumbs/History.es6';
import { user$ } from 'services/TokenStore.es6';

import * as crumbFactory from 'navigation/Breadcrumbs/Factory.es6';

import * as Validator from './Validator.es6';
import * as Focus from './Focus.es6';
import initDocErrorHandler from './DocumentErrorHandler.es6';
import { makeNotify } from './Notifications.es6';
import installTracking, { trackEntryView } from './Tracking.es6';

import { getModule } from 'NgRegistry.es6';
import createEntrySidebarProps from 'app/EntrySidebar/EntitySidebarBridge.es6';
import * as logger from 'services/logger.es6';
import * as Telemetry from 'Telemetry.es6';

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
 * @param {Object} preferences
 * @scope.requires {Data.FieldControl[]} formControls
 *   Passed to FormWidgetsController to render field controls
 */
export default async function create($scope, editorData, preferences) {
  $scope.context = {};
  const start = Date.now();

  Telemetry.record('entry_editor_http_time', Date.now() - start);

  // add list as parent state only if it's a deep link
  if (contextHistory.isEmpty()) {
    contextHistory.add(crumbFactory.EntryList());
  }

  // add current state
  contextHistory.add(crumbFactory.Entry(editorData.entity.getSys(), $scope.context));

  const editorContext = ($scope.editorContext = {});
  const entityInfo = (editorContext.entityInfo = editorData.entityInfo);

  const notify = makeNotify('Entry', () => '“' + $scope.title + '”');

  $scope.entityInfo = entityInfo;

  const doc = editorData.openDoc(K.scopeLifeline($scope));
  // TODO rename the scope property
  $scope.otDoc = doc;
  initDocErrorHandler($scope, doc.state.error$);

  K.onValueScope($scope, doc.status$, status => {
    $scope.statusNotificationProps = { status, entityLabel: 'entry' };
  });

  installTracking(entityInfo, doc, K.scopeLifeline($scope));
  try {
    // TODO: Do not directly access $parent in here!
    trackEntryView({
      editorData,
      entityInfo,
      currentSlideLevel: $scope.$parent.slideStates.length,
      locale: localeStore.getDefaultLocale().internal_code,
      editorType: $scope.$parent.slideStates.length > 1 ? 'slide_in_editor' : 'entry_editor'
    });
  } catch (error) {
    logger.logError(error);
  }

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

  $scope.$on('scroll-editor', (_ev, scrollTop) => {
    // TODO:danwe: Get rid of contextHistory in here!
    contextHistory.extendCurrent({ scroll: scrollTop });
  });

  $scope.user = K.getValue(user$);

  const startScroll = contextHistory.getLast().scroll;
  if (startScroll) {
    $scope.initialEditorScroll = startScroll;
  } else {
    // The first input element of the editor will become focused once
    // the document is loaded and the editor will scroll to that
    // position.
    editorContext.hasInitialFocus = true;
  }

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
  const contentTypeData = entityInfo.contentType;
  const fields = contentTypeData.fields;
  $scope.fields = DataFields.create(fields, $scope.otDoc);

  $scope.entrySidebarProps = createEntrySidebarProps({
    $scope
  });
}
