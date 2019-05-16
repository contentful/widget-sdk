import * as K from 'utils/kefir.es6';
import * as PathUtils from 'utils/Path.es6';
import makeExtensionDialogsHandler from './makeExtensionDialogsHandlers.es6';
import makeExtensionSpaceMethodsHandlers from './makeExtensionSpaceMethodsHandlers.es6';
import makeExtensionNavigationHandlers from './makeExtensionNavigationHandlers.es6';
import makeExtensionNotificationHandlers from './makeExtensionNotificationHandlers.es6';
import { LOCATION_ENTRY_FIELD, LOCATION_ENTRY_FIELD_SIDEBAR } from '../WidgetLocations.es6';

import createAppsClient from 'app/settings/apps/AppsClient.es6';

const ERROR_CODES = { EBADUPDATE: 'ENTRY UPDATE FAILED' };

const ERROR_MESSAGES = {
  MFAILUPDATE: 'Could not update entry field',
  MFAILREMOVAL: 'Could not remove value for field'
};

const REQUIRED_DEPENDENCIES = [
  '$rootScope',
  '$scope',
  'spaceContext',
  'TheLocaleStore',
  'entitySelector',
  'entityCreator',
  'Navigator',
  'SlideInNavigator'
];

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
  REQUIRED_DEPENDENCIES.forEach(key => {
    if (!(key in dependencies)) {
      throw new Error(`"${key}" not provided to the extension bridge.`);
    }
  });

  const { $rootScope, $scope, spaceContext, TheLocaleStore } = dependencies;

  const isFieldLevelExtension =
    location === LOCATION_ENTRY_FIELD || location === LOCATION_ENTRY_FIELD_SIDEBAR;

  return {
    getData,
    install,
    apply: fn => $rootScope.$apply(fn)
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
            locale: $scope.locale
          }
        : null,
      locales: {
        available: TheLocaleStore.getPrivateLocales(),
        default: TheLocaleStore.getDefaultLocale()
      },
      entryData: $scope.otDoc.getValueAt([]),
      contentTypeData: $scope.entityInfo.contentType,
      editorInterface: $scope.editorData.editorInterface
    };
  }

  async function setValue(path, value) {
    try {
      await $scope.otDoc.setValueAt(path, value);
      return value;
    } catch (err) {
      throw makeShareJSError(err, ERROR_MESSAGES.MFAILUPDATE);
    }
  }

  async function removeValue(path) {
    try {
      await $scope.otDoc.removeValueAt(path);
    } catch (err) {
      throw makeShareJSError(err, ERROR_MESSAGES.MFAILREMOVAL);
    }
  }

  function makeShareJSError(shareJSError, message) {
    const data = {};
    if (shareJSError && shareJSError.message) {
      data.shareJSCode = shareJSError.message;
    }

    const error = new Error(message);
    return Object.assign(error, { code: ERROR_CODES.EBADUPDATE, data });
  }

  function getLocaleSettings() {
    const mode = $scope.localeData.isSingleLocaleModeOn ? 'single' : 'multi';
    if (mode === 'single') {
      const focusedLocale = $scope.localeData.focusedLocale;
      return {
        mode,
        focused: focusedLocale ? focusedLocale.code : undefined
      };
    }
    const activeLocales = $scope.localeData.activeLocales || [];
    return {
      mode,
      active: activeLocales.map(locale => locale.code).filter(code => code)
    };
  }

  function install(api) {
    K.onValueScope($scope, $scope.otDoc.sysProperty, sys => {
      api.send('sysChanged', [sys]);
    });

    K.onValueScope(
      $scope,
      $scope.otDoc.changes.filter(path => PathUtils.isAffecting(path, ['fields'])),
      path => api.update(path, $scope.otDoc.getValueAt([]))
    );

    api.registerPathHandler('setValue', setValue);
    api.registerPathHandler('removeValue', removeValue);

    api.registerHandler('openDialog', makeExtensionDialogsHandler(dependencies));
    api.registerHandler('callSpaceMethod', makeExtensionSpaceMethodsHandlers(dependencies));
    api.registerHandler('navigateToContentEntity', makeExtensionNavigationHandlers(dependencies));
    api.registerHandler('notify', makeExtensionNotificationHandlers(dependencies));

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
      K.onValueScope($scope, $scope.fieldLocale.access$, access => {
        api.send('isDisabledChanged', [!!access.disabled]);
      });

      K.onValueScope($scope, $scope.fieldLocale.errors$, errors => {
        api.send('schemaErrorsChanged', [errors || []]);
      });

      api.registerHandler('setInvalid', (isInvalid, localeCode) => {
        $scope.fieldController.setInvalid(localeCode, isInvalid);
      });

      api.registerHandler('setActive', isActive => {
        $scope.fieldLocale.setActive(isActive);
      });
    }

    api.registerHandler('alpha', async ({ command, args }) => {
      if (command === 'proxyGetRequest' && args) {
        const client = createAppsClient(spaceContext.getId());
        const res = await client.proxyGetRequest(args.appId, args.url, args.headers);
        return res.json();
      }

      throw new Error('Unknown alpha command.');
    });
  }
}
