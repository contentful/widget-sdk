'use strict';

angular.module('cf.app')

/**
 * @ngdoc type
 * @module cf.app
 * @name Document
 * @property {boolean} disabled
 * @property {boolean} editable
 * @property {boolean} error
*/

/**
 * @ngdoc type
 * @module cf.app
 * @name Document
 * @description
 * Used to edit an entry or asset through ShareJS
 *
 * @property {Document.State} state
 */
.controller('entityEditor/Document',
['$scope', '$injector', 'entity', 'contentType',
function ($scope, $injector, entity, contentType) {
  var $q = $injector.get('$q');
  var ShareJS = $injector.get('data/ShareJS/Utils');
  var logger = $injector.get('logger');
  var moment = $injector.get('moment');
  var TheLocaleStore = $injector.get('TheLocaleStore');
  var K = $injector.get('utils/kefir');
  var controller = this;
  var diff = $injector.get('utils/StringDiff').diff;
  var Normalizer = $injector.get('data/documentNormalizer');
  var spaceContext = $injector.get('spaceContext');
  var docConnection = spaceContext.docConnection;
  var PresenceHub = $injector.get('entityEditor/Document/PresenceHub');

  // Field types that should use `setStringAt()` to set a value using a
  // string diff.
  var STRING_FIELD_TYPES = ['Symbol', 'Text'];

  // Set to true if scope is destroyed to cancel the handler for the
  // document open promise.
  var isDestroyed = false;

  var shouldOpen = false;

  controller.state = {
    editable: false,
    error: false,
    saving: false
  };

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

  // A boolean property that holds true if the document has
  // changes unacknowledged by the server.
  var hasPendingOps = docEventsBus.stream
    .map(function (event) {
      return event.doc;
    })
    .toProperty(function () {
      return controller.doc;
    })
    .map(function (doc) {
      return !!(doc && (doc.inflightOp || doc.pendingOp));
    });

  K.onValueScope($scope, hasPendingOps, function (hasPendingOps) {
    controller.state.saving = hasPendingOps;
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
        return event.data.map(function (op) {
          return op.p;
        });
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
  var sysProperty = sysChangeBus.stream
    .toProperty(_.noop)
    .map(function () {
      return entity.data.sys;
    });


  /**
   * @ngdoc property
   * @module cf.app
   * @name Document#state.isDirty
   * @description
   * Property that is `false` if and only if the document is published
   * and does not contain changes relative to the published version.
   *
   * Note that an entry is in the same state as its published version
   * if and only if its version is on more than the published version.
   *
   * @type {Property<boolean>}
   */
  controller.state.isDirty = sysProperty.map(function (sys) {
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
      return pathAffects(changePath, valuePath);
    })
    .toProperty(_.constant(undefined))
    .map(function () {
      return getValueAt(valuePath);
    });
  }


  var presence = PresenceHub.create($scope.user.sys.id, docEventsBus.stream, shout);

  K.onValueScope($scope, presence.collaborators, function (collaborators) {
    $scope.docCollaborators = collaborators;
  });

  $scope.$on('$destroy', function () {
    presence.destroy();
  });


  _.extend(controller, {
    doc: undefined,

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

    open: open,
    close: close
  });


  // If the document connection state changes, this watcher is triggered
  // Connection failures during editing are handled from this point onwards.
  $scope.$watch(function () {
    return shouldOpenDoc();
  }, function (shouldOpen) {
    if (shouldOpen) {
      openDoc();
    } else {
      setDoc(undefined);
    }
  });

  K.onValueScope($scope, docConnection.errors, function () {
    controller.state.error = true;
  });

  $scope.$on('$destroy', function () {
    isDestroyed = true;
    setDoc(undefined);
  });

  function shout (args) {
    var doc = controller.doc;
    if (doc && doc.state !== 'closed') {
      doc.shout(args);
    }
  }


  function getValueAt (path) {
    if (controller.doc) {
      return ShareJS.peek(controller.doc, path);
    } else {
      return dotty.get(entity.data, path);
    }
  }

  function setValueAt (path, value) {
    return withRawDoc(function (doc) {
      if ($scope.field && _.includes(STRING_FIELD_TYPES, $scope.field.type)) {
        return setDocumentStringAt(doc, path, value);
      } else {
        return setDocumentValueAt(doc, path, value);
      }
    });
  }

  function setDocumentValueAt (doc, path, value) {
    if (value === undefined) {
      return removeValueAt(path);
    }
    // We only test for equality when the value is guaranteed to be
    // equal. Other wise the some properties might have changed.
    if (!_.isObject(value) && value === getValueAt(path)) {
      return $q.resolve(value);
    } else {
      return ShareJS.setDeep(doc, path, value);
    }
  }

  function setDocumentStringAt (doc, path, newValue) {
    var oldValue = getValueAt(path);

    if (!oldValue || !newValue) {
      // TODO Do not set this to null. Set it to undefined!
      return setDocumentValueAt(doc, path, newValue || null);
    } else if (oldValue === newValue) {
      return $q.resolve(newValue);
    } else {
      var subDoc = doc.at(path);
      var patches = diff(oldValue, newValue);
      var ops = patches.map(function (p) {
        if (p.insert) {
          return $q.denodeify(function (cb) {
            subDoc.insert(p.insert[0], p.insert[1], cb);
          });
        } else if (p.delete) {
          return $q.denodeify(function (cb) {
            subDoc.del(p.delete[0], p.delete[1], cb);
          });
        }
      });
      return $q.all(ops);
    }
  }

  function removeValueAt (path) {
    return withRawDoc(function (doc) {
      return $q.denodeify(function (cb) {
        // We catch and ignore synchronous errors since they tell us
        // that a value along the path does not exist. I.e. it has
        // already been removed.
        try {
          doc.removeAt(path, cb);
        } catch (e) {
          cb();
        }
      });
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

  function open () {
    shouldOpen = true;
  }

  function close () {
    shouldOpen = false;
  }

  function shouldOpenDoc () {
    return spaceContext.docConnection.canOpen() && shouldOpen && !isDestroyed;
  }

  function openDoc () {
    docConnection.open(entity)
    .then(function (doc) {
      // Check a second time if we have disconnected or the document
      // has been disabled.
      if (shouldOpenDoc()) {
        setDoc(doc);
      } else {
        closeDoc(doc);
        setDoc(undefined);
      }
    }, function (err) {
      controller.state.error = true;
      setDoc(undefined);
      logger.logSharejsError('Failed to open sharejs doc', {
        data: {
          error: err,
          entity: entity
        }
      });
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
      controller.state.editable = false;
    }

    if (doc) {
      controller.state.error = false;
      normalize(doc);
      controller.doc = doc;
      controller.state.editable = true;
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
    } else {
      logger.logSharejsError('otUpdateEntityData did not update', {
        data: {
          entity: entity,
          otDoc: controller.doc
        }
      });
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

  /**
   * Returns true if a change to the value at 'changePath' in an object
   * affects the value of 'valuePath'.
   *
   * ~~~
   * pathAffects(['a'], ['a', 'b']) // => true
   * pathAffects(['a', 'b'], ['a', 'b']) // => true
   * pathAffects(['a', 'b', 'x'], ['a', 'b']) // => true
   *
   * pathAffects(['x'], ['a', 'b']) // => false
   * pathAffects(['a', 'x'], ['a', 'b']) // => false
   */
  function pathAffects (changePath, valuePath) {
    var m = Math.min(changePath.length, valuePath.length);
    return _.isEqual(changePath.slice(0, m), valuePath.slice(0, m));
  }


  function normalize (doc) {
    var locales = TheLocaleStore.getPrivateLocales();
    Normalizer.normalize(controller, doc.snapshot, contentType, locales);
  }
}]);
