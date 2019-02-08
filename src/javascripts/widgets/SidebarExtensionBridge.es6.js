import { get } from 'lodash';
import { Notification } from '@contentful/forma-36-react-components';
import * as K from 'utils/kefir.es6';
import * as PathUtils from 'utils/Path.es6';
import * as Dialogs from './ExtensionDialogs.es6';

const ERROR_CODES = { EBADUPDATE: 'ENTRY UPDATE FAILED' };

const ERROR_MESSAGES = {
  MFAILUPDATE: 'Could not update entry field',
  MFAILREMOVAL: 'Could not remove value for field'
};

const SIMPLE_DIALOG_TYPE_TO_OPENER = {
  alert: Dialogs.openAlert,
  confirm: Dialogs.openConfirm,
  prompt: Dialogs.openPrompt
};

const REQUIRED_DEPENDENCIES = [
  '$rootScope',
  '$scope',
  'spaceContext',
  'TheLocaleStore',
  'entitySelector',
  'Analytics',
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
export default function createBridge(dependencies) {
  REQUIRED_DEPENDENCIES.forEach(key => {
    if (!(key in dependencies)) {
      throw new Error(`"${key}" not provided to the extension bridge.`);
    }
  });

  const {
    $rootScope,
    $scope,
    spaceContext,
    TheLocaleStore,
    entitySelector,
    Analytics,
    entityCreator,
    Navigator,
    SlideInNavigator
  } = dependencies;

  return {
    getData,
    install,
    apply: fn => $rootScope.$apply(fn)
  };

  function getData() {
    return {
      spaceMembership: spaceContext.space.data.spaceMembership,
      locales: {
        available: TheLocaleStore.getPrivateLocales(),
        default: TheLocaleStore.getDefaultLocale()
      },
      entryData: $scope.otDoc.getValueAt([]),
      contentTypeData: $scope.entityInfo.contentType,
      parameters: {
        instance: {},
        installation: {}
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
    if (Object.keys(SIMPLE_DIALOG_TYPE_TO_OPENER).includes(type)) {
      const open = SIMPLE_DIALOG_TYPE_TO_OPENER[type];
      return open(options);
    }

    if (type === 'entitySelector') {
      return entitySelector.openFromExtension(options);
    }

    throw new Error('Unknown dialog type.');
  }

  async function navigate(options) {
    if (!['Entry', 'Asset'].includes(options.entityType)) {
      throw new Error('Unknown entity type.');
    }

    const entity = await makeEntity(options);

    try {
      await navigateToEntity(entity, options.slideIn);
    } catch (err) {
      throw new Error('Failed to navigate to the entity.');
    }

    // Right now we're returning this object with a single `navigated`
    // property. In the future we could grow the API, for example by
    // adding a method to listen to close events of the slide-in editor.
    return { navigated: true };
  }

  async function makeEntity(options) {
    if (typeof options.id === 'string') {
      // A valid ID is given, create a stub entity that can be used for navigation.
      return makeStubEntity(options);
    } else {
      try {
        return await createEntity(options);
      } catch (err) {
        throw new Error('Failed to create an entity.');
      }
    }
  }

  function makeStubEntity(options) {
    return {
      sys: {
        type: options.entityType,
        id: options.id,
        space: { sys: { id: spaceContext.getId() } },
        environment: { sys: { id: spaceContext.getEnvironmentId() } }
      }
    };
  }

  async function createEntity(options) {
    // Important note:
    // `entityCreator` returns legacy client entities, we need to extract `entity.data`.

    if (options.entityType === 'Entry' && typeof options.contentTypeId === 'string') {
      const created = await entityCreator.newEntry(options.contentTypeId);
      return created.data;
    } else if (options.entityType === 'Asset') {
      const created = await entityCreator.newAsset();
      return created.data;
    }

    throw new Error('Could not determine how to create the requested entity.');
  }

  async function navigateToEntity(entity, slideIn = false) {
    if (slideIn) {
      // This method is sync but the URL change is an async side-effect.
      SlideInNavigator.goToSlideInEntity(entity.sys);
    } else {
      await Navigator.go(Navigator.makeEntityRef(entity));
    }
  }

  async function callSpaceMethod(methodName, args) {
    try {
      // TODO: Use `getBatchingApiClient(spaceContext.cma)`
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

  async function notify({ type, message }) {
    if (['success', 'error'].includes(type) && typeof message === 'string') {
      Notification[type](message);
    } else {
      throw new Error('Invalid notification type.');
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
    api.registerHandler('openDialog', openDialog);
    api.registerHandler('callSpaceMethod', callSpaceMethod);
    api.registerHandler('navigateToContentEntity', navigate);
    api.registerHandler('notify', notify);
  }
}
