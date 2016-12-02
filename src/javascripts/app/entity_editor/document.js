'use strict';

angular.module('contentful')
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
.factory('entityEditor/Document', ['require', function (require) {
  var $q = require('$q');
  var ShareJS = require('data/ShareJS/Utils');
  var TheLocaleStore = require('TheLocaleStore');
  var K = require('utils/kefir');
  var Normalizer = require('data/documentNormalizer');
  var PresenceHub = require('entityEditor/Document/PresenceHub');
  var StringField = require('entityEditor/Document/StringField');
  var PathUtils = require('utils/Path');
  var DocLoad = require('data/ShareJS/Connection').DocLoad;
  var caseof = require('libs/sum-types').caseof;
  var Reverter = require('entityEditor/Document/Reverter');
  var accessChecker = require('accessChecker');
  var Status = require('data/Document/Status');
  var Permissions = require('access_control/EntityPermissions');
  var deepFreeze = require('utils/DeepFreeze').deepFreeze;
  var ResourceStateManager = require('data/document/ResourceStateManager');

  return {create: create};

  // TODO Instead of passing an entity instance provided by the client
  // library we should only pass the entity data.
  function create (docConnection, entity, contentType, user, spaceEndpoint) {
    var currentDoc;
    var cleanupTasks = [];

    // We assume that the permissions only depend on the immutable data
    // like the ID the content type ID and the creator.
    var permissions = Permissions.create(entity.data.sys);

    // The stream for this bus contains all the events that come from the
    // raw ShareJS doc. The data in this stream has the shape
    // `{doc: doc, name: name, data: data}`.
    var docEventsBus = K.createBus();
    cleanupTasks.push(docEventsBus.end);


    /**
     * @ngdoc property
     * @module contentful
     * @name Document#state.isSaving$
     * A boolean property that holds true if the document has
     * changes unacknowledged by the server.
     */
    var isSaving$ = K.sampleBy(docEventsBus.stream, function () {
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
    var changes = docEventsBus.stream
    .flatten(function (event) {
      if (event.name === 'change') {
        var paths = _.map(event.data, _.property('p'));
        return [PathUtils.findCommonPrefix(paths)];
      } else if (event.name === 'open') {
        // Emit the path of length zero
        return [[]];
      } else {
        return [];
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

    var sysBus = K.createPropertyBus(entity.data.sys);
    cleanupTasks.push(sysBus.end);
    var sysProperty = sysBus.property;

    var currentSys;
    K.onValue(sysProperty, function (sys) {
      currentSys = sys;
    });

    docEventsBus.stream.onValue(function (event) {
      var previousVersion = currentSys.version;
      var version = event.doc.version;
      var nextSys = _.cloneDeep(event.doc.snapshot.sys);
      if (version > previousVersion) {
        nextSys.updatedAt = (new Date()).toISOString();
      } else {
        nextSys.updatedAt = currentSys.updatedAt;
      }
      nextSys.version = version;
      sysBus.set(deepFreeze(nextSys));
    });


    var readOnly$ = sysProperty.map(function (sys) {
      return sys.archivedVersion || sys.deletedVersion || !permissions.can('update');
    }).skipDuplicates();
    var docLoader = docConnection.getDocLoader(entity, readOnly$);


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
    var isDirty$ = sysProperty.map(function (sys) {
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
     * @param {string[]} path
     * @returns {Property<any>}
     */
    var memoizedValuePropertyAt = _.memoize(valuePropertyAt, function (path) {
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
    var doc$ = docLoader.doc.map(function (doc) {
      return caseof(doc, [
        [DocLoad.Doc, function (d) {
          return d.doc;
        }],
        [null, function () {
          return null;
        }]
      ]);
    });

    var offDoc = K.onValue(doc$, setDoc);
    cleanupTasks.push(offDoc);

    // Property<boolean>
    // Is true if there was an error opening the document. E.g. when
    // disconnected from the server.
    var docLoadError$ = docLoader.doc.map(function (doc) {
      return caseof(doc, [
        [DocLoad.Doc, function () {
          return false;
        }],
        [DocLoad.None, function () {
          return false;
        }],
        [DocLoad.Error, function () {
          return true;
        }]
      ]);
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
    var status$ = Status.create(
      sysProperty,
      docLoadError$,
      accessChecker.canUpdateEntity(entity)
    );


    var presence = PresenceHub.create(user.sys.id, docEventsBus.stream, shout);
    cleanupTasks.push(presence.destroy);

    var version$ = sysProperty.map(function (sys) {
      return sys.version;
    });
    var reverter = Reverter.create(getValueAt([]), version$, setFields);


    /**
     * @ngdoc property
     * @name Document#state.isConnected$
     * @type Property<boolean>
     * @description
     * Is true if the document is connected
     */
    var isConnected$ = doc$.map(function (doc) {
      return !!doc;
    }).skipDuplicates();

    cleanupTasks.push(function () {
      forgetCurrentDoc();
      docLoader.destroy();
    });

    var resourceState = ResourceStateManager.create(
      sysProperty,
      sysBus.set,
      getData,
      spaceEndpoint
    );

    // We cannot simply use `valuePropertiesAt([])` because the SJS
    // document does not track the 'updatedAt' property.
    var data$ = K.combinePropertiesObject({
      sys: sysProperty,
      fields: valuePropertyAt(['fields'])
    });

    // The entity instance is unique for the ID. Other views will share
    // the same instance and not necessarily load the data. This is why
    // we need to make sure that we keep it up date.
    data$.onValue(function (data) {
      entity.data = data;
      if (data.sys.deletedVersion) {
        entity.setDeleted();
        delete entity.data;
      }
    });

    var instance = {
      destroy: destroy,
      getVersion: getVersion,

      state: {
        // Used by Entry/Asset editor controller
        isSaving$: isSaving$,
        // Used by 'cfFocusOtInput' directive and 'FieldLocaleController'
        isConnected$: isConnected$,
        // Used by Entry/Asset editor controller
        isDirty$: isDirty$
      },

      status$: status$,

      getValueAt: getValueAt,
      setValueAt: setValueAt,
      removeValueAt: removeValueAt,
      insertValueAt: insertValueAt,
      pushValueAt: pushValueAt,
      moveValueAt: moveValueAt,

      changes: changes,
      valuePropertyAt: memoizedValuePropertyAt,
      sysProperty: sysProperty,

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

    return instance;

    /**
     * Used by resource state manager
     */
    function getData () {
      var data = {
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
      } else {
        return _.cloneDeep(dotty.get(entity.data, path));
      }
    }

    function setValueAt (path, value) {
      return withRawDoc(function (doc) {
        if (path.length === 3 && StringField.is(path[1], contentType)) {
          return StringField.setAt(doc, path, value);
        } else {
          return ShareJS.setDeep(doc, path, value);
        }
      });
    }

    function removeValueAt (path) {
      return withRawDoc(function (doc) {
        return ShareJS.remove(doc, path);
      });
    }

    function insertValueAt (path, i, x) {
      return withRawDoc(function (doc) {
        if (getValueAt(path)) {
          return $q.denodeify(function (cb) {
            doc.insertAt(path, i, x, cb);
          });
        } else if (i === 0) {
          return setValueAt(path, [x]);
        } else {
          return $q.reject(new Error('Cannot insert index ' + i + 'into empty container'));
        }
      });
    }

    function pushValueAt (path, value) {
      var current = getValueAt(path);
      var pos = current ? current.length : 0;
      return insertValueAt(path, pos, value);
    }

    function moveValueAt (path, from, to) {
      return $q.denodeify(function (cb) {
        currentDoc.moveAt(path, from, to, cb);
      });
    }

    function setDoc (doc) {
      forgetCurrentDoc();

      if (doc) {
        currentDoc = doc;
        normalize(doc);
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

    function withRawDoc (cb) {
      if (currentDoc) {
        return cb(currentDoc);
      } else {
        return $q.reject(new Error('ShareJS document is not connected'));
      }
    }

    function normalize (doc) {
      var locales = TheLocaleStore.getPrivateLocales();
      Normalizer.normalize(instance, doc.snapshot, contentType, locales);
    }


    // Passed to document reverter
    function setFields (fields) {
      return setValueAt(['fields'], fields)
      .then(getVersion);
    }

    function getVersion () {
      return currentDoc && currentDoc.version;
    }
  }
}]);
