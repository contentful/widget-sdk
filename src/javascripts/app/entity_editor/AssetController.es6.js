import * as K from 'utils/kefir.es6';
import { truncate } from 'utils/StringUtils.es6';
import { user$ } from 'services/TokenStore.es6';
import * as Validator from './Validator.es6';
import * as Focus from './Focus.es6';
import initDocErrorHandler from './DocumentErrorHandler.es6';
import { makeNotify } from './Notifications.es6';
import installTracking from './Tracking.es6';
import createEntrySidebarProps from 'app/EntrySidebar/EntitySidebarBridge.es6';
import SidebarEventTypes from 'app/EntrySidebar/SidebarEventTypes.es6';
import DocumentStatusCode from 'data/document/statusCode.es6';
import { groupBy, get, isEmpty, keys } from 'lodash';

import { getModule } from 'NgRegistry.es6';

const $controller = getModule('$controller');
const spaceContext = getModule('spaceContext');
const TheLocaleStore = getModule('TheLocaleStore');

/**
 * @param {Object} $scope
 * @param {Object} editorData
 * @returns {Promise<void>}
 */
export default async function create($scope, editorData, preferences) {
  $scope.context = {};
  $scope.editorData = editorData;

  const editorContext = ($scope.editorContext = {});
  const entityInfo = (editorContext.entityInfo = editorData.entityInfo);

  const notify = makeNotify('Asset', () => '“' + $scope.title + '”');

  $scope.entityInfo = entityInfo;

  // TODO rename the scope property
  $scope.otDoc = editorData.openDoc(K.scopeLifeline($scope));
  initDocErrorHandler($scope, $scope.otDoc.state.error$);

  K.onValueScope($scope, $scope.otDoc.status$, status => {
    $scope.statusNotificationProps = { status, entityLabel: 'asset' };
  });

  installTracking(entityInfo, $scope.otDoc, K.scopeLifeline($scope));

  editorContext.validator = Validator.createForAsset(
    $scope.otDoc,
    TheLocaleStore.getPrivateLocales()
  );

  editorContext.focus = Focus.create();

  $scope.state = $controller('entityEditor/StateController', {
    $scope,
    entity: editorData.entity,
    notify,
    validator: editorContext.validator,
    otDoc: $scope.otDoc
  });

  K.onValueScope($scope, $scope.otDoc.valuePropertyAt([]), data => {
    const title = spaceContext.assetTitle({
      getContentTypeId: () => {},
      data
    });
    $scope.context.title = title;
    $scope.title = truncate(title, 50);
  });

  K.onValueScope($scope, $scope.otDoc.state.isDirty$, isDirty => {
    $scope.context.dirty = isDirty;
  });

  $scope.user = K.getValue(user$);

  editorContext.hasInitialFocus = preferences.hasInitialFocus;

  // Building the form
  $controller('FormWidgetsController', {
    $scope,
    controls: editorData.fieldControls.form
  });

  $scope.entrySidebarProps = createEntrySidebarProps({
    $scope
  });

  $scope.locales = TheLocaleStore.getLocales();
  $scope.focusedLocale = TheLocaleStore.getFocusedLocale();
  $scope.activeLocales = TheLocaleStore.getActiveLocales();
  $scope.isSingleLocaleModeOn = TheLocaleStore.isSingleLocaleModeOn();

  $scope.entrySidebarProps.emitter.on(SidebarEventTypes.SET_SINGLE_LOCALE_MODE, isOn => {
    TheLocaleStore.setSingleLocaleMode(isOn);
    if (!isOn) {
      $scope.statusNotificationProps = {
        status: 'ok',
        entityLabel: 'asset'
      };
    }
    $scope.isSingleLocaleModeOn = isOn;
    $scope.$applyAsync();
  });

  $scope.entrySidebarProps.emitter.on(SidebarEventTypes.UPDATED_FOCUSED_LOCALE, newLocale => {
    TheLocaleStore.setFocusedLocale(newLocale);
    $scope.focusedLocale = newLocale;
  });

  $scope.$watch('focusedLocale', () => {
    $scope.focusedLocale = TheLocaleStore.getFocusedLocale();
    if (defaultLocaleIsFocused()) {
      $scope.statusNotificationProps = {
        status: 'ok',
        entityLabel: 'asset'
      };
    }
    $scope.$applyAsync();
  });

  K.onValueScope($scope, editorContext.validator.errors$, errors => {
    if (!$scope.isSingleLocaleModeOn) {
      // We only want to display the top-nav notification about locale errors
      // if we are in the single focused locale mode.
      return;
    }
    $scope.entrySidebarProps.localeErrors = groupBy(errors, error => error.path[2]);

    if (errors.length && !defaultLocaleIsFocused()) {
      $scope.statusNotificationProps = {
        status: DocumentStatusCode.DEFAULT_LOCALE_FILE_ERROR,
        entityLabel: 'asset'
      };
    }
  });

  K.onValueScope($scope, $scope.otDoc.status$, status => {
    if (
      status === 'ok' &&
      !isEmpty(get($scope, 'entrySidebarProps.localeErrors')) &&
      !defaultLocaleIsFocused()
    ) {
      return;
    }
    $scope.statusNotificationProps = { status, entityLabel: 'entry' };
  });

  function defaultLocaleIsFocused() {
    if (!$scope.isSingleLocaleModeOn) {
      return false;
    }
    const localeCodes = keys($scope.entrySidebarProps.localeErrors);
    return (
      localeCodes.length === 1 &&
      TheLocaleStore.getDefaultLocale().internal_code ===
        TheLocaleStore.getFocusedLocale().internal_code
    );
  }
}
