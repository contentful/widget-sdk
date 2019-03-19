import * as K from 'utils/kefir.es6';
import { groupBy, isEmpty } from 'lodash';
import SidebarEventTypes from 'app/EntrySidebar/SidebarEventTypes.es6';
import DocumentStatusCode from 'data/document/statusCode.es6';
import { getModule } from 'NgRegistry.es6';

const TheLocaleStore = getModule('TheLocaleStore');

export default ($scope, entityLabel, shouldHideLocaleErrors) => {
  Object.assign($scope.localeData, {
    defaultLocale: TheLocaleStore.getDefaultLocale(),
    privateLocales: TheLocaleStore.getPrivateLocales(),
    focusedLocale: TheLocaleStore.getFocusedLocale(),
    isSingleLocaleModeOn: TheLocaleStore.isSingleLocaleModeOn(),
    activeLocales: TheLocaleStore.getActiveLocales(),
    isLocaleActive: TheLocaleStore.isLocaleActive,
    errors: {}
  });

  $scope.entrySidebarProps.emitter.on(SidebarEventTypes.SET_SINGLE_LOCALE_MODE, isOn => {
    if (!isOn) {
      resetStatusNotificationProps();
    }
    TheLocaleStore.setSingleLocaleMode(isOn);
    $scope.localeData.isSingleLocaleModeOn = isOn;
    setVisibleWidgets();
    $scope.$applyAsync();
  });

  $scope.entrySidebarProps.emitter.on(SidebarEventTypes.UPDATED_FOCUSED_LOCALE, locale => {
    TheLocaleStore.setFocusedLocale(locale);
    $scope.localeData.focusedLocale = locale;
    if (isEmpty($scope.localeData.errors) || shouldHideLocaleErrors()) {
      resetStatusNotificationProps();
    }
    setVisibleWidgets();
    $scope.$applyAsync();
  });

  $scope.entrySidebarProps.emitter.on(SidebarEventTypes.DEACTIVATED_LOCALE, locale => {
    TheLocaleStore.deactivateLocale(locale);
    $scope.localeData.activeLocales = TheLocaleStore.getActiveLocales();
    if (isEmpty($scope.localeData.errors) || shouldHideLocaleErrors()) {
      resetStatusNotificationProps();
    }
    setVisibleWidgets();
    $scope.$applyAsync();
  });

  $scope.entrySidebarProps.emitter.on(SidebarEventTypes.SET_ACTIVE_LOCALES, locales => {
    TheLocaleStore.setActiveLocales(locales);
    $scope.localeData.activeLocales = TheLocaleStore.getActiveLocales();
    if (isEmpty($scope.localeData.errors) || shouldHideLocaleErrors()) {
      resetStatusNotificationProps();
    }
    setVisibleWidgets();
    $scope.$applyAsync();
  });

  K.onValueScope($scope, $scope.editorContext.validator.errors$, errors => {
    if (!$scope.localeData.isSingleLocaleModeOn) {
      // We only want to display the top-nav notification about locale errors
      // if we are in the single focused locale mode.
      return;
    }

    // path[2] will be the internal code for the locale, unless we're in the
    // asset editor, in which case it will be undefined. In that case we want
    // it to be aliased to the default locale's internal code, since this should
    // always refer to a missing file error.
    $scope.localeData.errors = groupBy(
      errors,
      error => error.path[2] || $scope.defaultLocale.internal_code
    );

    if (errors.length && !shouldHideLocaleErrors()) {
      const status =
        entityLabel === 'entry'
          ? DocumentStatusCode.LOCALE_VALIDATION_ERRORS
          : DocumentStatusCode.DEFAULT_LOCALE_FILE_ERROR;
      $scope.statusNotificationProps = { status, entityLabel };
    }
  });

  K.onValueScope($scope, $scope.otDoc.status$, status => {
    if (status === 'ok' && !isEmpty($scope.localeData.errors) && !shouldHideLocaleErrors()) {
      return;
    }
    $scope.statusNotificationProps = { status, entityLabel };
  });

  setVisibleWidgets();

  function resetStatusNotificationProps() {
    $scope.statusNotificationProps = {
      status: 'ok',
      entityLabel
    };
  }

  function setVisibleWidgets() {
    if (
      $scope.localeData.isSingleLocaleModeOn &&
      $scope.localeData.focusedLocale.internal_code !==
        $scope.localeData.defaultLocale.internal_code
    ) {
      $scope.visibleWidgets = $scope.widgets.filter(w => w.field.localized);
    } else {
      $scope.visibleWidgets = $scope.widgets;
    }
  }
};
