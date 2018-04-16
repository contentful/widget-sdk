/**
 * @ngdoc service
 * @module contentful
 * @name Document
 * @description
 * Used to edit an entry or asset through ShareJS
 *
 * The 'SnapshotComparatorController/snapshotDoc' module also provides
 * an implementation for the interface defined here. Any changes must
 * be synced across these implementations
 */

import * as _ from 'lodash';
import $q from '$q';
import * as K from 'utils/kefir';
import { deepFreeze } from 'utils/Freeze';
import * as PathUtils from 'utils/Path';
import { caseof } from 'sum-types';
import * as logger from 'logger';
import * as accessChecker from 'access_control/AccessChecker';
import * as Permissions from 'access_control/EntityPermissions';
import * as TheLocaleStore from 'TheLocaleStore';

import { Error as DocError } from 'data/document/Error';
import * as Normalizer from 'data/document/Normalize';
import * as ResourceStateManager from 'data/document/ResourceStateManager';
import * as Status from 'data/Document/Status';
import { DocLoad } from 'data/sharejs/Connection';
import * as ShareJS from 'data/ShareJS/Utils';

import * as Reverter from 'entityEditor/Document/Reverter';
import * as PresenceHub from 'entityEditor/Document/PresenceHub';
import * as StringField from 'entityEditor/Document/StringField';


// TODO Instead of passing an entity instance provided by the client
// library we should only pass the entity data.
export function create (docConnection, entity, contentType, user, spaceEndpoint) {
  let currentDoc;
  const cleanupTasks = [];

  // We need this to determine and log inconsistencies later
  const initialEntitySys = _.cloneDeep(entity.data.sys);

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

  function makeDocErrorHandler (path) {
    return function (error) {
      if (error === 'forbidden') {
        docConnection.refreshAuth()
          .catch(function () { errorBus.emit(DocError.SetValueForbidden(path)); });
      }
    };
  }

  /**
   * @ngdoc property
   * @module contentful
   * @name Document#state.isSaving$
   * A boolean property that holds true if the document has
   * changes unacknowledged by the server.
   */
  const isSaving$ = K.sampleBy(docEventsBus.stream, function () {
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
  const changes = docEventsBus.stream
  .flatten(function (event) {
    if (event.name === 'change') {
      const paths = _.map(event.data, _.property('p'));
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
  changes.onValue(function (changePath) {
    if (PathUtils.isPrefix(changePath, ['fields']) && currentDoc) {
      const locales = TheLocaleStore.getPrivateLocales();
      Normalizer.normalize({
        getValueAt: getValueAt,
        setValueAt: setValueAt
      }, currentDoc.snapshot, contentType, locales);
    }
  });


  /**
   * @ngdoc property
   * @module cf.app
   * @name Document#sysProperty
   * @description
   * A property that keeps the value of the entity’s `sys` property.
   *
   * TODO rename this to sys$
   *
   * @type {Property<Data.Sys>}
   */

  const sysBus = K.createPropertyBus(entity.data.sys);
  cleanupTasks.push(sysBus.end);
  const sysProperty = sysBus.property;

  let currentSys;
  K.onValue(sysProperty, function (sys) {
    currentSys = sys;
  });

  docEventsBus.stream.onValue(function (event) {
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

    const nextSys = _.cloneDeep(event.doc.snapshot.sys);
    if (version > previousVersion) {
      nextSys.updatedAt = (new Date()).toISOString();
    } else {
      nextSys.updatedAt = currentSys.updatedAt;
    }
    nextSys.version = version;
    sysBus.set(deepFreeze(nextSys));
  });


  // Holds true if the user is allowed to edit the entity
  const isEditable$ = sysProperty.map(function (sys) {
    return !sys.archivedVersion && !sys.deletedVersion && permissions.can('update');
  }).skipDuplicates();
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
  const isDirty$ = sysProperty.map(function (sys) {
    return sys.publishedVersion
      ? sys.version > sys.publishedVersion + 1
      : true;
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
  const memoizedValuePropertyAt = _.memoize(valuePropertyAt, function (path) {
    return path.join('!');
  });

  function valuePropertyAt (valuePath) {
    return changes.filter(function (changePath) {
      return PathUtils.isAffecting(changePath, valuePath);
    })
    .toProperty(_.constant(undefined))
    .map(function () {
      return getValueAt(valuePath);
    });
  }

  // Property<ShareJS.Document?>
  const doc$ = docLoader.doc.map(function (doc) {
    return caseof(doc, [
      [DocLoad.Doc, function (d) {
        return d.doc;
      }],
      [null, _.constant(null)]
    ]);
  }).skipDuplicates();


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
  const pending$ = docLoader.doc.map(function (d) {
    return caseof(d, [
      [DocLoad.Pending, _.constant(true)],
      [null, _.constant(false)]
    ]);
  }).skipDuplicates();

  const loaded$ = K.holdWhen(
    pending$.map(function (x) {
      return !x;
    }),
    _.identity
  );


  const offDoc = K.onValue(doc$, setDoc);
  cleanupTasks.push(offDoc);

  // Property<string?>
  // Is `null` if there is no error and the error code otherwise.
  // Known error codes are 'forbidden' and 'disconnected'.
  const docLoadError$ = docLoader.doc.map(function (doc) {
    return caseof(doc, [
      [DocLoad.Error, function (e) { return e.error; }],
      [null, _.constant(null)]
    ]);
  });

  docLoadError$.onValue(function (error) {
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
   * - 'archived'
   * - 'ok'
   *
   * This property is used by 'cfEditorStatusNotifcation' directive.
   */
  const status$ = Status.create(
    sysProperty,
    docLoadError$,
    accessChecker.canUpdateEntity(entity)
  );


  const presence = PresenceHub.create(user.sys.id, docEventsBus.stream, shout);
  cleanupTasks.push(presence.destroy);

  const version$ = sysProperty.map(function (sys) {
    return sys.version;
  });
  const reverter = Reverter.create(getValueAt([]), version$, setFields);


  /**
   * @ngdoc property
   * @name Document#state.isConnected$
   * @type Property<boolean>
   * @description
   * Is true if the document is connected
   */
  const isConnected$ = doc$.map(function (doc) {
    return !!doc;
  }).skipDuplicates();


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
  const canEdit$ = K.combineProperties([isEditable$, isConnected$], function (isEditable, isConnected) {
    return isEditable && isConnected;
  });


  cleanupTasks.push(function () {
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
  // we need to make sure that we keep it up date.
  data$.onValue(function (data) {
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
    destroy: destroy,
    getVersion: getVersion,

    state: {
      // Used by Entry/Asset editor controller
      isSaving$: isSaving$,
      // Used by 'cfFocusOtInput' directive and 'FieldLocaleController'
      isConnected$: isConnected$,
      // Used by Entry/Asset editor controller
      isDirty$: isDirty$,

      canEdit$: canEdit$,

      loaded$: loaded$,

      error$: errorBus.stream
    },

    status$: status$,

    getValueAt: getValueAt,
    setValueAt: setValueAt,
    removeValueAt: removeValueAt,
    insertValueAt: insertValueAt,
    pushValueAt: pushValueAt,

    changes: changes,
    localFieldChanges$: localFieldChangesBus.stream,

    valuePropertyAt: memoizedValuePropertyAt,
    sysProperty: sysProperty,
    data$: data$,

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
    reverter: reverter,

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
    permissions: permissions,

    resourceState: resourceState
  };


  /**
   * Used by resource state manager
   */
  function getData () {
    const data = {
      fields: getValueAt(['fields']),
      sys: _.cloneDeep(currentSys)
    };
    return deepFreeze(data);
  }

  function destroy () {
    cleanupTasks.forEach(function (task) {
      task();
    });
  }

  function shout (args) {
    if (currentDoc && currentDoc.state !== 'closed') {
      currentDoc.shout(args);
    }
  }

  function getValueAt (path) {
    if (currentDoc) {
      return _.cloneDeep(ShareJS.peek(currentDoc, path));
    } else if (Array.isArray(path) && path.length === 0) {
      return _.cloneDeep(entity.data);
    } else {
      return _.cloneDeep(_.get(entity.data, path));
    }
  }

  function setValueAt (path, value) {
    return withRawDoc(function (doc) {
      maybeEmitLocalChange(path);
      if (path.length === 3 && StringField.is(path[1], contentType)) {
        return StringField.setAt(doc, path, value);
      } else {
        return ShareJS.setDeep(doc, path, value);
      }
    }, makeDocErrorHandler(path));
  }

  function removeValueAt (path) {
    return withRawDoc(function (doc) {
      maybeEmitLocalChange(path);
      return ShareJS.remove(doc, path);
    }, makeDocErrorHandler(path));
  }

  function insertValueAt (path, i, x) {
    return withRawDoc(function (doc) {
      if (getValueAt(path)) {
        maybeEmitLocalChange(path);
        return $q.denodeify(function (cb) {
          doc.insertAt(path, i, x, cb);
        }).catch(function (err) {
          makeDocErrorHandler(path)(err);
          return $q.reject(err);
        });
      } else if (i === 0) {
        maybeEmitLocalChange(path);
        return setValueAt(path, [x]);
      } else {
        return $q.reject(new Error('Cannot insert index ' + i + 'into empty container'));
      }
    });
  }

  function pushValueAt (path, value) {
    const current = getValueAt(path);
    const pos = current ? current.length : 0;
    maybeEmitLocalChange(path);
    return insertValueAt(path, pos, value);
  }

  function setDoc (doc) {
    forgetCurrentDoc();

    if (doc) {
      currentDoc = doc;
      plugDocEvents(doc);
    }
  }

  function forgetCurrentDoc () {
    if (currentDoc) {
      currentDoc.emit = currentDoc._originalEmit;
      currentDoc = undefined;
      presence.leave();
      docLoader.close();
    }
  }

  function plugDocEvents (doc) {
    doc._originalEmit = doc.emit;
    doc.emit = function (name, data) {
      this._originalEmit.apply(this, arguments);
      docEventsBus.emit({doc: doc, name: name, data: data});
    };
    docEventsBus.emit({doc: doc, name: 'open'});
  }

  function withRawDoc (cb, errorListener) {
    let result;
    if (currentDoc) {
      result = cb(currentDoc);
    } else {
      result = $q.reject(new Error('ShareJS document is not connected'));
    }
    return result.catch(function (error) {
      if (errorListener) {
        errorListener(error);
      }
      return $q.reject(error);
    });
  }


  // Passed to document reverter
  function setFields (fields) {
    return setValueAt(['fields'], fields)
    .then(getVersion);
  }

  function getVersion () {
    return K.getValue(sysProperty).version;
  }

  function maybeEmitLocalChange (path) {
    if (path.length >= 3 && path[0] === 'fields') {
      localFieldChangesBus.emit([path[1], path[2]]);
    }
  }
}
