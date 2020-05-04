import * as K from 'core/utils/kefir';
import { groupBy, isEmpty, keys } from 'lodash';
import SidebarEventTypes from 'app/EntrySidebar/SidebarEventTypes';
import DocumentStatusCode from 'data/document/statusCode';
import TheLocaleStore from 'services/localeStore';
import * as Navigator from 'states/Navigator';
import { statusProperty } from './Document';

export default ($scope, { entityLabel, shouldHideLocaleErrors, emitter }) => {
  setLocaleData($scope);
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
    activeLocales: TheLocaleStore.getActiveLocales(),
    isLocaleActive: TheLocaleStore.isLocaleActive,
    errors: {},
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

function handleSidebarEvents($scope, entityLabel, shouldHideLocaleErrors, emitter) {
  emitter.on(SidebarEventTypes.SET_SINGLE_LOCALE_MODE, (isOn) => {
    if (!isOn) {
      resetStatusNotificationProps($scope, entityLabel);
    }
    TheLocaleStore.setSingleLocaleMode(isOn);
    $scope.localeData.isSingleLocaleModeOn = isOn;
    $scope.$applyAsync(() => {
      $scope.editorContext.validator.run();
    });
  });

  emitter.on(SidebarEventTypes.UPDATED_FOCUSED_LOCALE, (locale) => {
    TheLocaleStore.setFocusedLocale(locale);
    $scope.localeData.focusedLocale = locale;
    $scope.$applyAsync(() => {
      $scope.editorContext.validator.run();
      if (isEmpty($scope.localeData.errors) || shouldHideLocaleErrors()) {
        resetStatusNotificationProps($scope, entityLabel);
      }
    });
  });

  emitter.on(SidebarEventTypes.DEACTIVATED_LOCALE, (locale) => {
    if (isEmpty($scope.localeData.errors) || shouldHideLocaleErrors()) {
      resetStatusNotificationProps($scope, entityLabel);
    }
    TheLocaleStore.deactivateLocale(locale);
    $scope.localeData.activeLocales = TheLocaleStore.getActiveLocales();
    $scope.$applyAsync();
  });

  emitter.on(SidebarEventTypes.SET_ACTIVE_LOCALES, (locales) => {
    if (isEmpty($scope.localeData.errors) || shouldHideLocaleErrors()) {
      resetStatusNotificationProps($scope, entityLabel);
    }
    TheLocaleStore.setActiveLocales(locales);
    $scope.localeData.activeLocales = TheLocaleStore.getActiveLocales();
    $scope.$applyAsync();
  });
}

function handleTopNavErrors($scope, entityLabel, shouldHideLocaleErrors) {
  K.onValueScope($scope, $scope.editorContext.validator.errors$, (errors) => {
    const { defaultLocale, focusedLocale } = $scope.localeData;
    if (!$scope.localeData.isSingleLocaleModeOn) {
      // We only want to display the top-nav notification about locale errors
      // if we are in the single focused locale mode.
      return;
    }

    // path[2] will be the internal code for the locale, unless we're in the
    // asset editor, in which case it will be undefined. In that case we want
    // it to be aliased to the default locale's internal code, since this should
    // always refer to a missing file error.
    const localesErrors = groupBy(errors, (error) => error.path[2] || defaultLocale.internal_code);
    $scope.localeData.errors = localesErrors;
    if (!isEmpty(localesErrors) || shouldHideLocaleErrors()) {
      return;
    }

    const { privateLocales: locales } = $scope.localeData;
    const erroredKeys = keys(localesErrors);
    let erroredLocales = erroredKeys.map((ic) => locales.find((l) => l.internal_code === ic));
    let status;

    if (entityLabel === 'entry') {
      status = DocumentStatusCode.LOCALE_VALIDATION_ERRORS;
    } else if (entityLabel === 'asset') {
      if (erroredKeys.length === 1 && erroredKeys.includes(defaultLocale.internal_code)) {
        // Asset: When only default locale is invalid.
        status = DocumentStatusCode.DEFAULT_LOCALE_FILE_ERROR;
      } else {
        // Asset: When non-default locales are invalid, ignore the currently focused locale.
        // This also hides a validation error notification for when an asset is being processed – temporary has no "url" field.
        erroredLocales = erroredLocales.filter(
          (locale) => locale.internal_code !== focusedLocale.internal_code
        );
        if (!isEmpty(erroredLocales)) {
          status = DocumentStatusCode.LOCALE_VALIDATION_ERRORS;
        }
      }
    }

    if (status) {
      $scope.statusNotificationProps = {
        status,
        entityLabel,
        erroredLocales,
      };
    }
  });

  K.onValueScope($scope, statusProperty($scope.otDoc), (status) => {
    // If there are locales errors (and doc is ok), keep the old notification.
    if (
      status === DocumentStatusCode.OK &&
      !isEmpty($scope.localeData.errors) &&
      !shouldHideLocaleErrors()
    ) {
      return;
    }
    const entityRef = Navigator.makeEntityRef($scope.editorData.entity.data);
    $scope.statusNotificationProps = {
      status,
      entityLabel,
      // Drop 'previousEntries' (comes from slide-in/bulk editor) to open the specific entry details page
      entityHref: Navigator.href(entityRef).split('?').shift(),
    };
  });
}

function resetStatusNotificationProps($scope, entityLabel) {
  $scope.statusNotificationProps = {
    status: 'ok',
    entityLabel,
  };
}
