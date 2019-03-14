import * as K from 'utils/kefir.es6';
import * as PathUtils from 'utils/Path.es6';
import { get } from 'lodash';
import makeExtensionDialogsHandler from './ExtensionDialogsHandler.es6';
import makeExtensionSpaceMethodsHandler from './ExtensionSpaceMethodsHandler.es6';
import makeExtensionNavigationHandler from './ExtensionNavigationHandler.es6';
import makeExtensionNotificationHandler from './ExtensionNotificationHandler.es6';
import { LOCATION_ENTRY_FIELD, LOCATION_ENTRY_SIDEBAR } from '../WidgetLocations.es6';
import { createEndpoint } from 'data/EndpointFactory.es6';

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
export default function createBridge(dependencies, location = LOCATION_ENTRY_FIELD) {
  REQUIRED_DEPENDENCIES.forEach(key => {
    if (!(key in dependencies)) {
      throw new Error(`"${key}" not provided to the extension bridge.`);
    }
  });

  const { $rootScope, $scope, spaceContext, TheLocaleStore } = dependencies;

  return {
    getData,
    install,
    apply: fn => $rootScope.$apply(fn)
  };

  function getData() {
    return {
      location,
      spaceMembership: spaceContext.space.data.spaceMembership,
      current:
        location === LOCATION_ENTRY_SIDEBAR
          ? null
          : {
              field: $scope.widget.field,
              locale: $scope.locale
            },
      locales: {
        available: TheLocaleStore.getPrivateLocales(),
        default: TheLocaleStore.getDefaultLocale()
      },
      entryData: $scope.otDoc.getValueAt([]),
      contentTypeData: $scope.entityInfo.contentType
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
    api.registerHandler('callSpaceMethod', makeExtensionSpaceMethodsHandler(dependencies));
    api.registerHandler('navigateToContentEntity', makeExtensionNavigationHandler(dependencies));
    api.registerHandler('notify', makeExtensionNotificationHandler(dependencies));

    // Available for field-level extensions only:
    if (location !== LOCATION_ENTRY_SIDEBAR) {
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

    // Exposing a full, authenticated API client for development
    // builds of UI Extensions SDK.
    api.registerHandler('___internal___request', createEndpoint());

    setupActivityListeners(api);
  }

  function setupActivityListeners(api) {
    const visibilityChanged = event => {
      // `event.target` is `document`.
      const docVisible = !get(event, ['target', 'hidden'], false);
      if (docVisible) {
        // Browser tab was focused. Read the currently focused field ID:
        const focusedField = K.getValue($scope.editorContext.focus.field$);
        // If it's a string, there is a field focused:
        api.send('editorActivityChanged', [typeof focusedField === 'string']);
      } else {
        // Always send `false` if the browser tab is defocused:
        api.send('editorActivityChanged', [false]);
      }
    };

    // Listen to browser tab focus ("visibility") events:
    const visibilityListener = ['visibilitychange', visibilityChanged, false];
    document.addEventListener(...visibilityListener);
    $scope.$on('$destroy', () => document.removeEventListener(...visibilityListener));

    // Listen to field focus activity:
    K.onValueScope($scope, $scope.editorContext.focus.field$, focusedField => {
      if (!get(document, ['hidden'], false)) {
        api.send('editorActivityChanged', [typeof focusedField === 'string']);
      }
    });
  }
}
