import { get } from 'lodash';
import * as K from 'utils/kefir.es6';
import * as PathUtils from 'utils/Path.es6';

const ERROR_CODES = { EBADUPDATE: 'ENTRY UPDATE FAILED' };

const ERROR_MESSAGES = {
  MFAILUPDATE: 'Could not update entry field',
  MFAILREMOVAL: 'Could not remove value for field'
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
export default function createBridge({
  $rootScope,
  $scope,
  spaceContext,
  TheLocaleStore,
  entitySelector,
  Analytics
}) {
  return {
    getData,
    install,
    apply: fn => $rootScope.$apply(fn)
  };

  function getData() {
    return {
      spaceMembership: spaceContext.space.data.spaceMembership,
      current: {
        field: $scope.widget.field,
        locale: $scope.locale
      },
      locales: {
        available: TheLocaleStore.getPrivateLocales(),
        default: TheLocaleStore.getDefaultLocale()
      },
      entryData: $scope.otDoc.getValueAt([]),
      contentTypeData: $scope.entityInfo.contentType,
      parameters: {
        instance: $scope.widget.settings || {},
        installation: $scope.widget.installationParameterValues || {}
      }
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

  async function openDialog(type, options) {
    if (type === 'entitySelector') {
      return entitySelector.openFromExtension(options);
    } else {
      throw new Error('Unknown dialog type.');
    }
  }

  async function callSpaceMethod(methodName, args) {
    try {
      const entity = await spaceContext.cma[methodName](...args);
      maybeTrackEntryAction(methodName, args, entity);
      return entity;
    } catch ({ code, body }) {
      const err = new Error('Request failed.');
      throw Object.assign(err, { code, data: body });
    }
  }

  function maybeTrackEntryAction(methodName, args, entity) {
    try {
      if (get(entity, ['sys', 'type']) !== 'Entry') {
        return;
      }

      if (methodName === 'createEntry') {
        trackEntryAction('create', args[0], entity);
      } else if (methodName === 'publishEntry') {
        const contentTypeId = get(args[0], ['sys', 'contentType', 'sys', 'id']);
        trackEntryAction('publish', contentTypeId, entity);
      }
    } catch (err) {
      // Just catch and ignore, failing to track should not
      // demonstrate itself outside.
    }
  }

  function trackEntryAction(action, contentTypeId, data) {
    Analytics.track(`entry:${action}`, {
      eventOrigin: 'ui-extension',
      // Stub content type object:
      contentType: {
        sys: { id: contentTypeId, type: 'ContentType' },
        fields: []
      },
      response: { data }
    });
  }

  function install(api) {
    $scope.$on('$destroy', () => api.destroy());

    $scope.$watch(
      () => $scope.fieldLocale.access.disabled,
      isDisabled => api.send('isDisabledChanged', [isDisabled])
    );

    K.onValueScope($scope, $scope.otDoc.sysProperty, sys => {
      api.send('sysChanged', [sys]);
    });

    K.onValueScope($scope, $scope.fieldLocale.errors$, errors => {
      api.send('schemaErrorsChanged', [errors || []]);
    });

    K.onValueScope(
      $scope,
      $scope.otDoc.changes.filter(path => PathUtils.isAffecting(path, ['fields'])),
      path => api.update(path, $scope.otDoc.getValueAt([]))
    );

    api.registerPathHandler('setValue', setValue);
    api.registerPathHandler('removeValue', removeValue);
    api.registerHandler('openDialog', openDialog);
    api.registerHandler('callSpaceMethod', callSpaceMethod);

    api.registerHandler('setInvalid', (isInvalid, localeCode) => {
      $scope.fieldController.setInvalid(localeCode, isInvalid);
    });

    api.registerHandler('setActive', isActive => {
      $scope.fieldLocale.setActive(isActive);
    });
  }
}
