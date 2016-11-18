'use strict';

angular.module('cf.app')

/**
 * @ngdoc type
 * @module cf.app
 * @name Document
 * @description
 * Used to edit an entry or asset through ShareJS
 *
 * The 'SnapshotComparatorController/snapshotDoc' module also provides
 * an implementation for the interface defined here. Any changes must
 * be synced across these implementations
 */
.controller('entityEditor/Document', ['$scope', 'require', 'entity', 'contentType', function ($scope, require, entity, contentType) {
  var $q = require('$q');
  var ShareJS = require('data/ShareJS/Utils');
  var moment = require('moment');
  var TheLocaleStore = require('TheLocaleStore');
  var K = require('utils/kefir');
  var controller = this;
  var Normalizer = require('data/documentNormalizer');
  var spaceContext = require('spaceContext');
  var docConnection = spaceContext.docConnection;
  var PresenceHub = require('entityEditor/Document/PresenceHub');
  var StringField = require('entityEditor/Document/StringField');
  var PathUtils = require('utils/Path');
  var DocLoad = require('data/ShareJS/Connection').DocLoad;
  var caseof = require('libs/sum-types').caseof;
  var Reverter = require('entityEditor/Document/Reverter');
  var accessChecker = require('accessChecker');
  var Status = require('data/Document/Status');

  var readOnlyBus = K.createPropertyBus(false, $scope);


  // The stream for this bus contains all the events that come from the
  // raw ShareJS doc. The data in this stream has the shape
  // `{doc: doc, name: name, data: data}`.
  var docEventsBus = K.createBus($scope);

  var acknowledgeEvent = docEventsBus.stream.filter(function (event) {
    return event.name === 'acknowledge';
  });

  K.onValueScope($scope, acknowledgeEvent, function (event) {
    updateEntitySys(event.doc);
  });


  /**
   * @ngdoc property
   * @module cf.app
   * @name Document#state.isSaving$
   * A boolean property that holds true if the document has
   * changes unacknowledged by the server.
   */
  var isSaving$ = K.sampleBy(docEventsBus.stream, function () {
    var doc = controller.doc;
    return !!(doc && (doc.inflightOp || doc.pendingOp));
  });


  /**
   * @ngdoc property
   * @module cf.app
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

  // We sync the changes on the OT document snapshot to
  // `$scope.entity.data`.
  K.onValueScope($scope, changes, otUpdateEntityData);


  /**
   * @ngdoc property
   * @module cf.app
   * @name Document#sysProperty
   * @description
   * A property that keeps the value of the entity’s `sys` property.
   *
   * @type {Property<Data.Sys>}
   */
  var sysChangeBus = K.createBus($scope);
  var sysProperty = K.sampleBy(sysChangeBus.stream, function () {
    return entity.data.sys;
  });


  /**
   * @ngdoc property
   * @module cf.app
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
   * @module cf.app
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

  var docLoader = docConnection.getDocLoader(entity, readOnlyBus.property);

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

  K.onValueScope($scope, doc$, setDoc);

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


  var presence = PresenceHub.create($scope.user.sys.id, docEventsBus.stream, shout);

  K.onValueScope($scope, presence.collaborators, function (collaborators) {
    $scope.docCollaborators = collaborators;
  });

  $scope.$on('$destroy', function () {
    presence.destroy();
  });

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

  _.extend(controller, {
    // TODO do not expose internal reference
    doc: undefined,

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

    collaboratorsFor: presence.collaboratorsFor,
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

    setReadOnly: readOnlyBus.set
  });


  $scope.$on('$destroy', function () {
    setDoc(undefined);
    docLoader.destroy();
  });

  function shout (args) {
    var doc = controller.doc;
    if (doc && doc.state !== 'closed') {
      doc.shout(args);
    }
  }


  function getValueAt (path) {
    if (controller.doc) {
      return _.cloneDeep(ShareJS.peek(controller.doc, path));
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
      controller.doc.moveAt(path, from, to, cb);
    });
  }


  function closeDoc (doc) {
    presence.leave();
    try {
      doc.close();
    } catch (e) {
      if (e.message !== 'Cannot send to a closed connection') {
        throw e;
      }
    }
  }

  function setDoc (doc) {
    if (controller.doc) {
      unplugDocEvents(controller.doc);
      closeDoc(controller.doc);
      delete controller.doc;
    }

    if (doc) {
      controller.doc = doc;
      normalize(doc);
      plugDocEvents(doc);
    }
  }

  function updateEntitySys (doc) {
    entity.setVersion(doc.version);
    entity.data.sys.updatedAt = moment().toISOString();
    sysChangeBus.emit();
  }

  function otUpdateEntityData () {
    if (controller.doc) {
      var data = _.cloneDeep(controller.doc.snapshot);
      if (!data) {
        throw new Error('Failed to update entity: data not available');
      }
      if (!data.sys) {
        throw new Error('Failed to update entity: sys not available');
      }

      if (controller.doc.version > entity.data.sys.version) {
        data.sys.updatedAt = moment().toISOString();
      } else {
        data.sys.updatedAt = entity.data.sys.updatedAt;
      }
      data.sys.version = controller.doc.version;
      entity.update(data);
      sysChangeBus.emit();
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

  function unplugDocEvents (doc) {
    doc.emit = doc._originalEmit;
  }

  function withRawDoc (cb) {
    if (controller.doc) {
      return cb(controller.doc);
    } else {
      return $q.reject(new Error('ShareJS document is not connected'));
    }
  }

  function normalize (doc) {
    var locales = TheLocaleStore.getPrivateLocales();
    Normalizer.normalize(controller, doc.snapshot, contentType, locales);
  }


  // Passed to document reverter
  function setFields (fields) {
    return setValueAt(['fields'], fields)
    .then(function () {
      return dotty.get(controller, ['doc', 'version']);
    });
  }
}]);
