import * as K from 'utils/kefir.es6';
import { groupBy, isEmpty, keys } from 'lodash';
import SidebarEventTypes from 'app/EntrySidebar/SidebarEventTypes.es6';
import DocumentStatusCode from 'data/document/statusCode.es6';
import { onFeatureFlag } from 'utils/LaunchDarkly/index.es6';
import { getModule } from 'NgRegistry.es6';

const TheLocaleStore = getModule('TheLocaleStore');

const FEATURE_FLAG_TRANSLATION_WIDGET_DROPDOWN = 'feature-at-03-2019-translation-widget-dropdown';

export default ($scope, { entityLabel, shouldHideLocaleErrors, emitter }) => {
  setLocaleData($scope);
  handleSingleModeSupportFeatureFlag($scope);
  handleSidebarEvents($scope, entityLabel, shouldHideLocaleErrors, emitter);
  handleTopNavErrors($scope, entityLabel, shouldHideLocaleErrors);
};

export function setLocaleData($scope, { isBulkEditor = false } = {}) {
  maybeResetFocusedLocale();
  $scope.localeData = $scope.localeData || {};
  Object.assign($scope.localeData, {
    defaultLocale: TheLocaleStore.getDefaultLocale(),
    privateLocales: TheLocaleStore.getPrivateLocales(),
    focusedLocale: TheLocaleStore.getFocusedLocale(),
    isSingleLocaleModeOn: isBulkEditor ? false : TheLocaleStore.isSingleLocaleModeOn(),
    isSingleLocaleModeSupported: false,
    activeLocales: TheLocaleStore.getActiveLocales(),
    isLocaleActive: TheLocaleStore.isLocaleActive,
    errors: {}
  });
}

function maybeResetFocusedLocale() {
  if (!TheLocaleStore.getPrivateLocales().includes(TheLocaleStore.getFocusedLocale())) {
    // This would happen if the focused locale was changed or deleted by a
    // space administrator. In that case, the focused locale would still be
    // stored in localStorage, but the UI wouldn't be able to handle it
    // properly (since the CMA doesn't know about it and it's not in the list
    // of private locales). We default to 'resetting' the focused locale to
    // the default locale, which is always a safe choice.
    TheLocaleStore.setFocusedLocale(TheLocaleStore.getDefaultLocale());
  }
}

function handleSingleModeSupportFeatureFlag($scope) {
  onFeatureFlag($scope, FEATURE_FLAG_TRANSLATION_WIDGET_DROPDOWN, isEnabled => {
    $scope.localeData.isSingleLocaleModeSupported = isEnabled;
  });
}

function handleSidebarEvents($scope, entityLabel, shouldHideLocaleErrors, emitter) {
  emitter.on(SidebarEventTypes.SET_SINGLE_LOCALE_MODE, isOn => {
    if (!isOn) {
      resetStatusNotificationProps($scope, entityLabel);
    }
    TheLocaleStore.setSingleLocaleMode(isOn);
    $scope.localeData.isSingleLocaleModeOn = isOn;
    $scope.$applyAsync();
  });

  emitter.on(SidebarEventTypes.UPDATED_FOCUSED_LOCALE, locale => {
    if (isEmpty($scope.localeData.errors) || shouldHideLocaleErrors()) {
      resetStatusNotificationProps($scope, entityLabel);
    }
    TheLocaleStore.setFocusedLocale(locale);
    $scope.localeData.focusedLocale = locale;
    $scope.$applyAsync();
  });

  emitter.on(SidebarEventTypes.DEACTIVATED_LOCALE, locale => {
    if (isEmpty($scope.localeData.errors) || shouldHideLocaleErrors()) {
      resetStatusNotificationProps($scope, entityLabel);
    }
    TheLocaleStore.deactivateLocale(locale);
    $scope.localeData.activeLocales = TheLocaleStore.getActiveLocales();
    $scope.$applyAsync();
  });

  emitter.on(SidebarEventTypes.SET_ACTIVE_LOCALES, locales => {
    if (isEmpty($scope.localeData.errors) || shouldHideLocaleErrors()) {
      resetStatusNotificationProps($scope, entityLabel);
    }
    TheLocaleStore.setActiveLocales(locales);
    $scope.localeData.activeLocales = TheLocaleStore.getActiveLocales();
    $scope.$applyAsync();
  });
}

function handleTopNavErrors($scope, entityLabel, shouldHideLocaleErrors) {
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
      error => error.path[2] || $scope.localeData.defaultLocale.internal_code
    );

    if (errors.length && !shouldHideLocaleErrors()) {
      const { errors, privateLocales: locales } = $scope.localeData;
      const erroredLocales = keys(errors).map(ic => locales.find(l => l.internal_code === ic));
      const status =
        entityLabel === 'entry'
          ? DocumentStatusCode.LOCALE_VALIDATION_ERRORS
          : DocumentStatusCode.DEFAULT_LOCALE_FILE_ERROR;
      $scope.statusNotificationProps = { status, entityLabel, erroredLocales };
    }
  });

  K.onValueScope($scope, $scope.otDoc.status$, status => {
    if (status === 'ok' && !isEmpty($scope.localeData.errors) && !shouldHideLocaleErrors()) {
      return;
    }
    $scope.statusNotificationProps = { status, entityLabel };
  });
}

function resetStatusNotificationProps($scope, entityLabel) {
  $scope.statusNotificationProps = {
    status: 'ok',
    entityLabel
  };
}
