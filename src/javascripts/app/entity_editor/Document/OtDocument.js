import { get, cloneDeep, isEqual } from 'lodash';
import * as K from 'utils/kefir';
import { deepFreeze } from 'utils/Freeze';
import * as PathUtils from 'utils/Path';
import { caseof } from 'sum-types';
import * as Permissions from 'access_control/EntityPermissions';
import { Error as DocError } from 'data/document/Error';
import * as Normalizer from 'data/document/Normalize';
import * as ResourceStateManager from 'data/document/ResourceStateManager';
import * as DocSetters from 'data/document/Setters';
import DocumentStatusCode from 'data/document/statusCode';
import { DocLoad } from 'data/sharejs/Connection';
import * as Reverter from './Reverter';
import { getModule } from 'NgRegistry';
import * as logger from 'services/logger';
import TheLocaleStore from 'services/localeStore';
import * as ShareJS from 'data/sharejs/utils';
import { valuePropertyAt } from 'app/entity_editor/Document';

/**
 * @returns {EntityDocument}
 * @description
 * Used to edit an entry or asset through ShareJS
 *
 * TODO Instead of passing an entity instance provided by the client library we should only pass the entity data.
 */
export function create(docConnection, entity, contentType, user, spaceEndpoint) {
  const PresenceHub = getModule('entityEditor/Document/PresenceHub');

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
    } else if (error === DocumentStatusCode.INTERNAL_SERVER_ERROR) {
      errorBus.emit(DocumentStatusCode.INTERNAL_SERVER_ERROR);
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
  }).skipDuplicates();

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
   * @module contentful
   * @name Document#docLocalChangesBus
   * A stream of changes to the the document that includes
   * focus state, status changes and content modification.
   * The focus state changes are emitted in FieldLocaleDocument#notify()
   * The status changes are emitted in the ResourceStateManager module.
   * The content changes are emitted in Document#docEventsBus#onValue.
   *
   * TODO: it is not used anywhere (previously was used for SidebarBridge) and should be removed
   */

  const docLocalChangesBus = K.createPropertyBus();
  cleanupTasks.push(docLocalChangesBus.end);

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

    // Sharejs emits "change" event if the change is remote (it also emits "remoteop" with it)
    // so we listen to "acknowledge" events as these are only emitted with local changes.
    if (event.name === 'acknowledge') {
      const path = get(event, 'data[0].p', []);
      docLocalChangesBus.set({ name: 'changed', path });

      // There is no focus on reference field or the boolean's "clear" button
      // so we have to dispatcha a fake "blur" event to the changes bus.
      const fieldId = path[1];
      const field = contentType.data.fields.find(field => field.id === fieldId);
      const isReferenceField = get(field, 'items.type') === 'Link' || get(field, 'type') === 'Link';
      const isBooleanField = get(field, 'type') === 'Boolean';
      if (isReferenceField || isBooleanField) {
        docLocalChangesBus.set({ name: 'blur', path });
      }
    }

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
    const errors = {
      forbidden: DocError.OpenForbidden(),
      disconnected: DocError.Disconnected(),
      [DocumentStatusCode.INTERNAL_SERVER_ERROR]: DocumentStatusCode.INTERNAL_SERVER_ERROR
    };
    errorBus.emit(errors[error] || null);
  });

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
    spaceEndpoint,
    docLocalChangesBus
  );

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

  const document = {
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

    getValueAt,
    setValueAt: docSetters.setValueAt,
    removeValueAt: docSetters.removeValueAt,
    insertValueAt: docSetters.insertValueAt,
    pushValueAt: docSetters.pushValueAt,

    changes,

    sysProperty,

    /**
     * @type {PresenceHub}
     */
    presence,

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
   * @ngdoc property
   * @name Document#data$
   * @type Property<API.Entity>
   * @description
   * Holds the current entity data, i.e. the 'sys' and 'fields' properties.
   *
   * Note that we cannot simply use `valuePropertiesAt([])` because this will
   * represents the raw SJS snapshot which does not have 'sys.updatedAt'.
   */
  document.data$ = K.combinePropertiesObject({
    sys: sysProperty,
    fields: valuePropertyAt(document, ['fields'])
  });

  // Sync the data to the entity instance.
  // The entity instance is unique for the ID. Other views will share
  // the same instance and not necessarily load the data. This is why
  // we need to make sure that we keep it updated.
  document.data$.onValue(data => {
    entity.data = data;
    if (data.sys.deletedVersion) {
      entity.setDeleted();
      // We need to remove the `data` property. Otherwise `entity.isDeleted()`
      // will return `false`.
      delete entity.data;
    }
  });

  return document;

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
