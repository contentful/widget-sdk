import * as K from 'utils/kefir.es6';
import { truncate } from 'utils/StringUtils.es6';
import { constant, keys, get } from 'lodash';
import mitt from 'mitt';
import createExtensionBridge from 'widgets/bridges/createExtensionBridge.es6';
import { user$ } from 'services/TokenStore.es6';
import * as WidgetLocations from 'widgets/WidgetLocations.es6';
import * as SlideInNavigator from 'navigation/SlideInNavigator/index.es6';

import * as Validator from './Validator.es6';
import * as Focus from './Focus.es6';
import initDocErrorHandler from './DocumentErrorHandler.es6';
import { makeNotify } from './Notifications.es6';
import installTracking, { trackEntryView } from './Tracking.es6';
import { bootstrapEntryEditorLoadEvents } from 'app/entity_editor/LoadEventTracker.es6';
import setLocaleData from 'app/entity_editor/setLocaleData.es6';

import { getModule } from 'NgRegistry.es6';
import createEntrySidebarProps from 'app/EntrySidebar/EntitySidebarBridge.es6';
import * as logger from 'services/logger.es6';
import { getVariation } from 'LaunchDarkly.es6';
import { ENTRY_COMMENTS } from 'featureFlags.es6';
import TheLocaleStore from 'services/localeStore.es6';
import { buildFieldsApi } from 'app/entity_editor/dataFields.es6';

const $controller = getModule('$controller');
const spaceContext = getModule('spaceContext');
const $rootScope = getModule('$rootScope');
const entitySelector = getModule('entitySelector');
const entityCreator = getModule('entityCreator');

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
  $scope.context.ready = true;
  $scope.editorData = editorData;
  $scope.loadEvents = K.createStreamBus($scope);

  const editorContext = ($scope.editorContext = {});
  const entityInfo = (editorContext.entityInfo = editorData.entityInfo);

  const notify = makeNotify('Entry', () => '“' + $scope.title + '”');

  $scope.entityInfo = entityInfo;

  const doc = editorData.openDoc(K.scopeLifeline($scope));
  // TODO rename the scope property
  $scope.otDoc = doc;
  bootstrapEntryEditorLoadEvents($scope, $scope.loadEvents, editorData, trackLoadEvent);

  initDocErrorHandler($scope, doc.state.error$);

  installTracking(entityInfo, doc, K.scopeLifeline($scope));
  try {
    const slideCount = keys($scope.slideStates).length;
    trackEntryView({
      editorData,
      entityInfo,
      currentSlideLevel: slideCount,
      locale: TheLocaleStore.getDefaultLocale().internal_code,
      editorType: slideCount > 1 ? 'slide_in_editor' : 'entry_editor'
    });
  } catch (error) {
    logger.logError(error);
  }

  editorContext.validator = Validator.createForEntry(
    entityInfo.contentType,
    $scope.otDoc,
    spaceContext.publishedCTs,
    TheLocaleStore.getPrivateLocales()
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

  /**
   * Build the `entry.fields` api of the widget-sdk at one
   * place and put it on $scope so that we don't rebuild it
   * for every widget. Instead, we share this version in every
   * cfWidgetApi instance.
   */
  $scope.fields = buildFieldsApi(entityInfo.contentType.fields, $scope.otDoc);

  $scope.localeData = {};

  $scope.emitter = mitt();

  $scope.entrySidebarProps = createEntrySidebarProps({
    $scope,
    emitter: $scope.emitter
  });

  setLocaleData($scope, {
    entityLabel: 'entry',
    shouldHideLocaleErrors: onlyFocusedLocaleHasErrors,
    emitter: $scope.emitter
  });

  $controller('FormWidgetsController', {
    $scope,
    controls: editorData.fieldControls.form
  });

  $scope.$watch('localeData.focusedLocale.name', localeName => {
    $scope.noLocalizedFieldsAdviceProps = { localeName };
  });

  function onlyFocusedLocaleHasErrors() {
    const { errors, focusedLocale } = $scope.localeData;
    const localeCodes = keys(errors);
    return localeCodes.length === 1 && localeCodes[0] === focusedLocale.internal_code;
  }

  getVariation(ENTRY_COMMENTS, {
    organizationId: get(spaceContext, 'organization.sys.id')
  }).then(variation => {
    const isMasterEnvironment = spaceContext.isMasterEnvironment();
    $scope.shouldDisplayCommentsToggle = isMasterEnvironment && variation;
  });

  /* Custom Extension */

  $scope.customExtensionProps = {
    extension: editorData.editorExtension,
    bridge: createExtensionBridge(
      {
        $rootScope,
        $scope,
        spaceContext,
        TheLocaleStore,
        entitySelector,
        entityCreator,
        Navigator,
        SlideInNavigator
      },
      WidgetLocations.LOCATION_ENTRY_EDITOR
    )
  };
}
