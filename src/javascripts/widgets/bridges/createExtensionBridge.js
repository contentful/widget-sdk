import * as K from 'utils/kefir';
import * as PathUtils from 'utils/Path';
import get from 'lodash/get';
import TheLocaleStore from 'services/localeStore';
import { onSlideInNavigation } from 'navigation/SlideInNavigator/index';

import makeExtensionDialogsHandler from './makeExtensionDialogsHandlers';
import makeExtensionSpaceMethodsHandlers from './makeExtensionSpaceMethodsHandlers';
import makeExtensionNavigationHandlers from './makeExtensionNavigationHandlers';
import makeExtensionNotificationHandlers from './makeExtensionNotificationHandlers';
import makePageExtensionHandlers from './makePageExtensionHandlers';
import checkDependencies from './checkDependencies';
import { makeShareJSError, makePermissionError } from 'app/widgets/NewWidgetApi/createFieldApi';
import { LOCATION_ENTRY_FIELD, LOCATION_ENTRY_FIELD_SIDEBAR } from '../WidgetLocations';

const ERROR_MESSAGES = {
  MFAILUPDATE: 'Could not update entry field',
  MFAILREMOVAL: 'Could not remove value for field',
  MFAILPERMISSIONS: 'Could not update entry field',
};

// This module, given editor-specific Angular dependencies
// as listed below, returns a framework-agnostic interface:
//
// - `getData` returns an object of static data to be used
//   in the `ExtensionAPI` constructor.
// - `install` takes an instance of `ExtensionAPI`, registrs
//   handlers and notifies it about changes.
// - `apply` takes a function to be executed in the Angular
//   context (using `$rootScope.$apply`).
export default function createExtensionBridge(dependencies, location = LOCATION_ENTRY_FIELD) {
  const { $rootScope, $scope, spaceContext } = checkDependencies('ExtensionBridge', dependencies, [
    '$rootScope',
    '$scope',
    'spaceContext',
  ]);

  let unsubscribeFunctions = [];

  const isFieldLevelExtension =
    location === LOCATION_ENTRY_FIELD || location === LOCATION_ENTRY_FIELD_SIDEBAR;

  return {
    getData,
    install,
    uninstall: () => {
      unsubscribeFunctions.forEach((fn) => fn());
      unsubscribeFunctions = [];
    },
    apply: (fn) => $rootScope.$apply(fn),
  };

  function getData() {
    return {
      spaceId: spaceContext.getId(),
      environmentId: spaceContext.getEnvironmentId(),
      location,
      spaceMember: spaceContext.space.data.spaceMember,
      current: isFieldLevelExtension
        ? {
            field: $scope.widget.field,
            locale: $scope.locale,
          }
        : null,
      locales: {
        available: TheLocaleStore.getPrivateLocales(),
        default: TheLocaleStore.getDefaultLocale(),
      },
      entryData: $scope.otDoc.getValueAt([]),
      contentTypeData: $scope.entityInfo.contentType,
      initialContentTypesData: spaceContext.publishedCTs.getAllBare(),
      editorInterface: $scope.editorData.editorInterface,
    };
  }

  async function setValue(path, value) {
    const canEditLocale = get($scope, 'fieldLocale.canEditLocale', true);
    if (!canEditLocale) {
      throw makePermissionError();
    }
    try {
      await $scope.otDoc.setValueAt(path, value);
      return value;
    } catch (err) {
      throw makeShareJSError(err, ERROR_MESSAGES.MFAILUPDATE);
    }
  }

  async function removeValue(path) {
    const canEditLocale = get($scope, 'fieldLocale.canEditLocale', true);
    if (!canEditLocale) {
      throw makePermissionError();
    }
    try {
      await $scope.otDoc.removeValueAt(path);
    } catch (err) {
      throw makeShareJSError(err, ERROR_MESSAGES.MFAILREMOVAL);
    }
  }

  function getLocaleSettings() {
    const mode = $scope.localeData.isSingleLocaleModeOn ? 'single' : 'multi';
    if (mode === 'single') {
      const focusedLocale = $scope.localeData.focusedLocale;
      return {
        mode,
        focused: focusedLocale ? focusedLocale.code : undefined,
      };
    }
    const activeLocales = $scope.localeData.activeLocales || [];
    return {
      mode,
      active: activeLocales.map((locale) => locale.code).filter((code) => code),
    };
  }

  function install(api) {
    K.onValueScope($scope, $scope.otDoc.sysProperty, (sys) => {
      api.send('sysChanged', [sys]);
    });

    K.onValueScope(
      $scope,
      $scope.otDoc.changes.filter((path) => PathUtils.isAffecting(path, ['fields'])),
      (path) => api.update(path, $scope.otDoc.getValueAt([]))
    );

    unsubscribeFunctions.push(
      onSlideInNavigation((data) => {
        api.send('navigateSlideIn', [data]);
      })
    );

    api.registerPathHandler('setValue', setValue);
    api.registerPathHandler('removeValue', removeValue);

    api.registerHandler('openDialog', makeExtensionDialogsHandler(dependencies));
    api.registerHandler('callSpaceMethod', makeExtensionSpaceMethodsHandlers(dependencies));
    api.registerHandler(
      'navigateToContentEntity',
      makeExtensionNavigationHandlers(dependencies.spaceContext)
    );
    api.registerHandler('notify', makeExtensionNotificationHandlers(dependencies));
    api.registerHandler('navigateToPageExtension', makePageExtensionHandlers(dependencies));

    $scope.$watch('preferences.showDisabledFields', () => {
      api.send('showDisabledFieldsChanged', [$scope.preferences.showDisabledFields]);
    });

    $scope.$watch('localeData.activeLocales', () => {
      api.send('localeSettingsChanged', [getLocaleSettings()]);
    });

    $scope.$watch('localeData.isSingleLocaleModeOn', () => {
      api.send('localeSettingsChanged', [getLocaleSettings()]);
    });

    $scope.$watch('localeData.focusedLocale', () => {
      api.send('localeSettingsChanged', [getLocaleSettings()]);
    });

    // Available for field-level extensions only:
    if (isFieldLevelExtension) {
      K.onValueScope($scope, $scope.fieldLocale.access$, (access) => {
        api.send('isDisabledChanged', [!!access.disabled]);
      });

      K.onValueScope($scope, $scope.fieldLocale.errors$, (errors) => {
        api.send('schemaErrorsChanged', [errors || []]);
      });

      api.registerHandler('setInvalid', (isInvalid, localeCode) => {
        $scope.fieldController.setInvalid(localeCode, isInvalid);
      });

      api.registerHandler('setActive', (isActive) => {
        $scope.fieldLocale.setActive(isActive);
      });
    }
  }
}
