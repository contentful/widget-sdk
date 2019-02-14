/**
 * @ngdoc service
 * @module contentful
 * @name Document
 * @description
 * Used to edit an entry or asset through ShareJS
 */

import { get, memoize, cloneDeep, isEqual } from 'lodash';
import * as K from 'utils/kefir.es6';
import { deepFreeze } from 'utils/Freeze.es6';
import * as PathUtils from 'utils/Path.es6';
import { caseof } from 'sum-types';
import * as accessChecker from 'access_control/AccessChecker/index.es6';
import * as Permissions from 'access_control/EntityPermissions.es6';
import { Error as DocError } from 'data/document/Error.es6';
import * as Normalizer from 'data/document/Normalize.es6';
import * as ResourceStateManager from 'data/document/ResourceStateManager.es6';
import * as DocSetters from 'data/document/Setters.es6';
import DocumentStatusCode from 'data/document/statusCode.es6';
import { DocLoad } from 'data/sharejs/Connection.es6';
import * as Reverter from './document/Reverter.es6';
import { getModule } from 'NgRegistry.es6';
import * as logger from 'services/logger.es6';
import * as Status from 'data/document/status.es6';

const TheLocaleStore = getModule('TheLocaleStore');
const ShareJS = getModule('data/ShareJS/Utils');
const PresenceHub = getModule('entityEditor/Document/PresenceHub');

// TODO Instead of passing an entity instance provided by the client
// library we should only pass the entity data.
export function create(docConnection, entity, contentType, user, spaceEndpoint) {
  let currentDoc;
  const cleanupTasks = [];

  // We need this to determine and log inconsistencies later
  const initialEntitySys = cloneDeep(entity.data.sys);

  // We assume that the permissions only depend on the immutable data
  // like the ID the content type ID and the creator.
  const permissions = Permissions.create(entity.data.sys);

  // The stream for this bus contains all the events that come from the
  // raw ShareJS doc. The data in this stream has the shape
  // `{doc: doc, name: name, data: data}`.
  const docEventsBus = K.createBus();
  cleanupTasks.push(docEventsBus.end);

  /**
   * @ngdoc property
   * @name Document#state.error$
   * @type K.Stream<Doc.Error>
   * @description
   * A stream of error values. The value constructors are defined in
   * 'data/document/Error'.
   * It emits an event when opending or updating a document fails
   * with a 'forbidden' response from the server. In the future we
   * should include more errors.
   */
  const errorBus = K.createBus();
  cleanupTasks.push(errorBus.end);

  const docSetters = DocSetters.create({
    getDoc: () => currentDoc,
    getValueAt,
    contentType
  });
  docSetters.error$.onValue(({ error, path }) => {
    if (error === 'forbidden') {
      docConnection.refreshAuth().catch(() => {
        errorBus.emit(DocError.SetValueForbidden(path));
      });
    }
  });
  cleanupTasks.push(docSetters.destroy);

  /**
   * @ngdoc property
   * @module contentful
   * @name Document#state.isSaving$
   * A boolean property that holds true if the document has
   * changes unacknowledged by the server.
   */
  const isSaving$ = K.sampleBy(docEventsBus.stream, () => {
    return !!(currentDoc && (currentDoc.inflightOp || currentDoc.pendingOp));
  });

  /**
   * @ngdoc property
   * @module contentful
   * @name Document#valueChangesAt
   * @description
   * A stream of changes on the document. Whenever a value at a given
   * path is changed (either remotely or locally) we emit the path on
   * the stream.
   *
   * @type {Property<string[]>}
   */
  const changes = docEventsBus.stream.flatten(event => {
    if (event.name === 'change') {
      const paths = (event.data || []).map(error => error.p);
      return [PathUtils.findCommonPrefix(paths)];
    } else if (event.name === 'open') {
      // Emit the path of length zero
      return [[]];
    } else {
      return [];
    }
  });

  // Normalize snapshot.fields whenever the snapshot root or the
  // field container changes.
  // Snapshots send from the server might include removed locales or
  // deleted fields that the UI can’t handle. We just remove them
  // locally.
  // We need to make sure that this is the first handler for the
  // change stream. Subsequent handlers will access the snapshot on
  // we need to make sure that we present them with the normalized
  // version.
  changes.onValue(changePath => {
    if (PathUtils.isPrefix(changePath, ['fields']) && currentDoc) {
      const locales = TheLocaleStore.getPrivateLocales();
      Normalizer.normalize(
        {
          getValueAt,
          setValueAt: docSetters.setValueAt
        },
        currentDoc.snapshot,
        contentType,
        locales
      );
    }
  });

  /**
   * @ngdoc property
   * @module cf.app
   * @name Document#sysProperty
   * @description
   * A property that keeps the value of the entity’s `sys` property.
   *
   * NOTE: Since the `sys` we get form ShareJS does not feature an `updatedBy`,
   * we use the initial CMA entity's sys.updatedBy until the entity is (re-)published
   * and from that point on we set sys.updatedBy to sys.publishedBy
   *
   * TODO rename this to sys$
   *
   * @type {Property<Data.Sys>}
   */

  const sysBus = K.createPropertyBus(entity.data.sys);
  cleanupTasks.push(sysBus.end);
  const sysProperty = sysBus.property;

  let currentSys;
  K.onValue(sysProperty, sys => {
    currentSys = sys;
  });

  docEventsBus.stream.onValue(event => {
    const previousVersion = currentSys.version;
    const version = event.doc.version + (event.doc.compressed || 0);

    // ShareJS has some documents that are out of sync with the index
    // held in the CMA. We want to log these to be able to repair
    // them.
    if (version < initialEntitySys.version) {
      logger.logWarn('Inconsistent ShareJS document version', {
        data: {
          sysFromCMA: initialEntitySys,
          shareJsVersion: version
        }
      });
    }

    const nextSys = cloneDeep(event.doc.snapshot.sys);
    if (version > previousVersion) {
      nextSys.updatedAt = new Date().toISOString();
    } else {
      nextSys.updatedAt = currentSys.updatedAt;
    }
    nextSys.version = version;
    // ShareJS doc's sys is missing the `updatedBy` which we got in the initial CMA
    // entity though. The following logic is a compromise where we pretend that
    // unless the entity was published by another user, the entity was last updated
    // by the previous updater.
    // TODO: Build more meaningful `updatedBy` from the ShareJS operations.
    if (!nextSys.updatedBy) {
      if (nextSys.publishedCounter > currentSys.publishedCounter) {
        nextSys.updatedBy = nextSys.publishedBy;
      } else {
        // Pass this along from the initial CMA entity.sys to the ShareJS sys
        nextSys.updatedBy = currentSys.updatedBy;
      }
    }
    // ShareJS environment.sys.id is internal ID
    // (e.g. "40ee1ff0-d1a8-4d8c-a976-425c2aab5220" instead of "master")
    if (get(nextSys, 'environment.sys')) {
      nextSys.environment.sys.id = currentSys.environment.sys.id;
    } else {
      nextSys.environment = currentSys.environment;
    }

    // Effectively a .skipDuplicates(isEqual)
    // Comparing `version` first is just a performance optimization.
    if (currentSys.version !== nextSys.version && !isEqual(currentSys, nextSys)) {
      sysBus.set(deepFreeze(nextSys));
    }
  });

  // Holds true if the user is allowed to edit the entity
  const isEditable$ = sysProperty
    .map(sys => {
      return !sys.archivedVersion && !sys.deletedVersion && permissions.can('update');
    })
    .skipDuplicates();
  const docLoader = docConnection.getDocLoader(entity, isEditable$);

  /**
   * @ngdoc property
   * @module contentful
   * @name Document#state.isDirty$
   * @description
   * Property that is `false` if and only if the document is published
   * and does not contain changes relative to the published version.
   *
   * Note that an entry is in the same state as its published version
   * if and only if its version is on more than the published version.
   *
   * @type {Property<boolean>}
   */
  const isDirty$ = sysProperty.map(sys => {
    return sys.publishedVersion ? sys.version > sys.publishedVersion + 1 : true;
  });

  /**
   * @ngdoc method
   * @module contentful
   * @name Document#valuePropertyAt
   * @description
   * Returns a property that always has the current value at the given
   * path of the document.
   *
   * @deprecated
   * TODO replace this with specialized field access like, `getFieldValue(fid,
   * locale)`.
   *
   * @param {string[]} path
   * @returns {Property<any>}
   */
  const memoizedValuePropertyAt = memoize(valuePropertyAt, path => path.join('!'));

  function valuePropertyAt(valuePath) {
    return changes
      .filter(changePath => {
        return PathUtils.isAffecting(changePath, valuePath);
      })
      .toProperty(() => undefined)
      .map(() => getValueAt(valuePath));
  }

  // Property<ShareJS.Document?>
  const doc$ = docLoader.doc
    .map(doc => {
      return caseof(doc, [[DocLoad.Doc, d => d.doc], [null, () => null]]);
    })
    .skipDuplicates();

  /**
   * @ngdoc property
   * @name Document#state.loaded$
   * @type Property<boolean>
   * @description
   * Property holds true when the document has been loaded at least
   * once.
   *
   * In particular
   * - If loading fails this is true
   * - If the document is in read-only mode this is true
   * - If the document is unloaded later this is true
   */
  const pending$ = docLoader.doc
    .map(d => {
      return caseof(d, [[DocLoad.Pending, () => true], [null, () => false]]);
    })
    .skipDuplicates();

  const loaded$ = K.holdWhen(pending$.map(x => !x), x => x);

  const offDoc = K.onValue(doc$, setDoc);
  cleanupTasks.push(offDoc);

  // Property<string?>
  // Is `null` if there is no error and the error code otherwise.
  // Known error codes are 'forbidden' and 'disconnected'.
  const docLoadError$ = docLoader.doc.map(doc => {
    return caseof(doc, [[DocLoad.Error, e => e.error], [null, () => null]]);
  });

  docLoadError$.onValue(error => {
    if (error === 'forbidden') {
      errorBus.emit(DocError.OpenForbidden());
    }
  });

  /**
   * @ngdoc property
   * @name Document#status$
   * @type string
   * @description
   * Current status of the document
   *
   * Is one of
   * - 'editing-not-allowed'
   * - 'ot-connection-error'
   * - 'internal-server-error'
   * - 'archived'
   * - 'ok'
   *
   * This property is used by entry_editor/StatusNotification component.
   */
  const status$ = Status.create(
    sysProperty,
    docLoadError$,
    accessChecker.canUpdateEntity(entity),
    docSetters.error$
      // The only error we are interested in in this stream is
      // internal server errors coming from Sharejs.
      .filter(({ error }) => error === DocumentStatusCode.INTERNAL_SERVER_ERROR)
      .toProperty(() => ({ error: null }))
  );

  const presence = PresenceHub.create(user.sys.id, docEventsBus.stream, shout);
  cleanupTasks.push(presence.destroy);

  const version$ = sysProperty.map(sys => sys.version);
  const reverter = Reverter.create(getValueAt([]), version$, setFields);

  /**
   * @ngdoc property
   * @name Document#state.isConnected$
   * @type Property<boolean>
   * @description
   * Is true if the document is connected
   */
  const isConnected$ = doc$.map(doc => !!doc).skipDuplicates();

  /**
   * @ngdoc property
   * @module contentful
   * @name Document#state.canEdit$
   * @description
   * Property that is `true` if all of the following are true
   * - The user has general permissions to change the entity
   * - The entity is not archived and has not been deleted
   * - The document is connected to the server.
   *
   * Note that this does not take field based authorization into
   * account. For this see the `FieldLocaleController`.
   *
   * @type {Property<boolean>}
   */
  const canEdit$ = K.combineProperties(
    [isEditable$, isConnected$],
    (isEditable, isConnected) => isEditable && isConnected
  );

  cleanupTasks.push(() => {
    forgetCurrentDoc();
    docLoader.destroy();
  });

  const resourceState = ResourceStateManager.create(
    sysProperty,
    sysBus.set,
    getData,
    spaceEndpoint
  );

  /**
   * @ngdoc property
   * @name Document#data$
   * @type Property<API.Entity>
   * @description
   * Holds the current entity data, i.e. the 'sys' and 'fields' properties.
   *
   * Note that we cannot simply use `valuePropertiesAt([])` because this will
   * represents the raw SJS snapshot which does not have 'sys.updatedAt'.
   */
  const data$ = K.combinePropertiesObject({
    sys: sysProperty,
    fields: valuePropertyAt(['fields'])
  });

  // Sync the data to the entity instance.
  // The entity instance is unique for the ID. Other views will share
  // the same instance and not necessarily load the data. This is why
  // we need to make sure that we keep it updated.
  data$.onValue(data => {
    entity.data = data;
    if (data.sys.deletedVersion) {
      entity.setDeleted();
      // We need to remove the `data` property. Otherwise `entity.isDeleted()`
      // will return `false`.
      delete entity.data;
    }
  });

  /**
   * @ngdoc property
   * @name Document#localFieldChanges
   * @type Stream<[string, string]>
   * @description
   * Emits a field ID and locale code whenever the document is
   * changed on our side through one of the setter methods.
   */
  const localFieldChangesBus = K.createBus();
  cleanupTasks.push(localFieldChangesBus.end);

  return {
    destroy,
    getVersion,

    state: {
      // Used by Entry/Asset editor controller
      isSaving$,
      // Used by 'cfFocusOtInput' directive and 'FieldLocaleController'
      isConnected$,
      // Used by Entry/Asset editor controller
      isDirty$,

      canEdit$,

      loaded$,

      error$: errorBus.stream
    },

    status$,

    getValueAt,
    setValueAt: docSetters.setValueAt,
    removeValueAt: docSetters.removeValueAt,
    insertValueAt: docSetters.insertValueAt,
    pushValueAt: docSetters.pushValueAt,

    changes,
    localFieldChanges$: docSetters.localFieldChange$,

    valuePropertyAt: memoizedValuePropertyAt,
    sysProperty,
    data$,

    // TODO only expose presence
    collaboratorsFor: presence.collaboratorsFor,
    collaborators: presence.collaborators,
    notifyFocus: presence.focus,

    /**
     * @ngdoc property
     * @name Document#reverter
     * @type {Document/Reverter}
     * @description
     * Exposes the methods `reverter.hasChanges()` and
     * `reverter.revert()` to revert to the initial data of the
     * document.
     */
    reverter,

    /**
     * @ngdoc method
     * @name Document#permissions.can
     * @description
     * Returns true if the given action can be taken on the document.
     *
     * Supported actions are 'update', 'delete', 'publish',
     * 'unpublish', 'archive', 'unarchive'.
     *
     * @param {string} action
     * @returns {boolean}
     */
    /**
     * @ngdoc method
     * @name Document#permissions.canEditFieldLocale
     * @description
     * Returns true if the field locale can be edited.
     *
     * Accpets public IDs as parameters.
     *
     * This method is used by the 'FieldLocaleController'.
     *
     * @param {string} fieldId
     * @param {string} localeCode
     * @returns {boolean}
     */
    permissions,

    resourceState
  };

  /**
   * Used by resource state manager
   */
  function getData() {
    const data = {
      fields: getValueAt(['fields']),
      sys: cloneDeep(currentSys)
    };
    return deepFreeze(data);
  }

  function destroy() {
    cleanupTasks.forEach(task => task());
  }

  function shout(args) {
    if (currentDoc && currentDoc.state !== 'closed') {
      currentDoc.shout(args);
    }
  }

  function getValueAt(path) {
    if (currentDoc) {
      return cloneDeep(ShareJS.peek(currentDoc, path));
    } else if (Array.isArray(path) && path.length === 0) {
      return cloneDeep(entity.data);
    } else {
      return cloneDeep(get(entity.data, path));
    }
  }

  function setDoc(doc) {
    forgetCurrentDoc();

    if (doc) {
      currentDoc = doc;
      plugDocEvents(doc);
    }
  }

  function forgetCurrentDoc() {
    if (currentDoc) {
      currentDoc.emit = currentDoc._originalEmit;
      currentDoc = undefined;
      presence.leave();
      docLoader.close();
    }
  }

  function plugDocEvents(doc) {
    doc._originalEmit = doc.emit;
    doc.emit = function(name, data) {
      this._originalEmit(...arguments);
      docEventsBus.emit({ doc, name, data });
    };
    docEventsBus.emit({ doc, name: 'open' });
  }

  // Passed to document reverter
  function setFields(fields) {
    return docSetters.setValueAt(['fields'], fields).then(getVersion);
  }

  function getVersion() {
    return K.getValue(sysProperty).version;
  }
}
