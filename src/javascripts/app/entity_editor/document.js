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
['$scope', '$injector', 'entity',
function ($scope, $injector, entity) {
  var $q = $injector.get('$q');
  var ShareJS = $injector.get('ShareJS');
  var logger = $injector.get('logger');
  var defer = $injector.get('defer');
  var moment = $injector.get('moment');
  var TheLocaleStore = $injector.get('TheLocaleStore');
  var K = $injector.get('utils/kefir');
  var controller = this;
  var diff = $injector.get('utils/StringDiff').diff;

  var shouldOpen = false;

  var pathChangeBus = K.createBus($scope);

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
  var changes = pathChangeBus.stream;

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


  _.extend(controller, {
    doc: undefined,
    state: {
      editable: false,
      error: false,
      saving: false
    },

    getValueAt: getValueAt,
    setValueAt: setValueAt,
    removeValueAt: removeValueAt,

    changes: changes,
    valuePropertyAt: memoizedValuePropertyAt,
    sysProperty: sysProperty,

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
    } else if (controller.doc) {
      closeDoc(controller.doc);
    }
  });


  // Watch Doc internals to determine if we have sent operations to the
  // server that have yet to be acknowledged.
  // TODO Instead of watching trigger the update manually on some
  // events on the document.
  $scope.$watchGroup([
    function () { return controller.doc && controller.doc.inflightOp; },
    function () { return controller.doc && controller.doc.pendingOp; }
  ], function (ops) {
    controller.state.saving = _.some(ops);
  });

  $scope.$watch(function () {
    return ShareJS.connectionFailed();
  }, function (failed) {
    // We do not want to remove errors that result from failed document
    // opening. Therefore we only set the error to `true` and to to
    // `failed`.
    if (failed) {
      controller.state.error = true;
    }
  });

  $scope.$on('$destroy', handleScopeDestruction);

  function getValueAt (path) {
    if (controller.doc) {
      return ShareJS.peek(controller.doc, path);
    } else {
      return dotty.get(entity.data, path);
    }
  }

  function setValueAt (path, value) {
    var stringFieldTypes = ['Symbol', 'Text'];

    if ($scope.field && _.includes(stringFieldTypes, $scope.field.type)) {
      return setStringAt(path, value);
    } else {
      return _setValueAt(path, value);
    }
  }

  function _setValueAt (path, value) {

    if (value === undefined) {
      return removeValueAt(path);
    }
    // TODO this should actually reject when doc is not available
    var doc = controller.doc;
    if (doc) {
      // We only test for equality when the value is guaranteed to be
      // equal. Other wise the some properties might have changed.
      if (!_.isObject(value) && value === getValueAt(path)) {
        return $q.resolve(value);
      } else {
        return ShareJS.setDeep(doc, path, value);
      }
    } else {
      return $q.reject(new Error('Cannot set value on document'));
    }
  }

  function setStringAt (path, newValue) {
    var oldValue = getValueAt(path);

    if (!oldValue || !newValue) {
      // TODO Do not set this to null. Set it to undefined!
      return _setValueAt(path, newValue || null);
    } else if (oldValue === newValue) {
      return $q.resolve(newValue);
    } else {
      var doc = controller.doc && controller.doc.at(path);
      var patches = diff(oldValue, newValue);
      var ops = patches.map(function (p) {
        if (p.insert) {
          return $q.denodeify(function (cb) {
            doc.insert(p.insert[0], p.insert[1], cb);
          });
        } else if (p.delete) {
          return $q.denodeify(function (cb) {
            doc.del(p.delete[0], p.delete[1], cb);
          });
        }
      });
      return $q.all(ops);
    }
  }

  function removeValueAt (path) {
    return $q.denodeify(function (cb) {
      // We catch synchronous errors since they tell us that a
      // value along the path does not exist.
      // TODO this should actually reject when doc is not available
      try {
        controller.doc.removeAt(path, cb);
      } catch (e) {
        cb();
      }
    });
  }

  function open () {
    shouldOpen = true;
  }

  function close () {
    shouldOpen = false;
  }

  function shouldOpenDoc () {
    return ShareJS.isConnected() && shouldOpen;
  }

  function openDoc () {
    ShareJS.open(entity)
    .then(function (doc) {
      setupClosedEventHandling(doc);
      // Check a second time if we have disconnected or the document
      // has been disabled.
      if (shouldOpenDoc()) {
        controller.state.error = false;
        setupOtDoc(doc);
      } else {
        closeDoc(doc);
      }
    }, function (err) {
      controller.state.error = true;
      handleOtDocOpeningFailure(err, entity);
    });
  }

  function closeDoc (doc) {
    try {
      doc.close();
    } catch (e) {
      if (e.message !== 'Cannot send to a closed connection') {
        throw e;
      }
    } finally {
      resetOtDoc();
    }
  }


  function handleOtDocOpeningFailure (err, entity) {
    resetOtDoc();
    logger.logSharejsError('Failed to open sharejs doc', {
      data: {
        error: err,
        entity: entity
      }
    });
  }

  function setupClosedEventHandling (doc) {
    // Remove all event listeners when the document is closed.
    // TODO I’m not sure this accomplishes what we want. In any case
    // this should be done through the doc’s public API.
    doc.on('closed', function () {
      defer(function () {
        doc._listeners.length = 0;
        _.each(doc._events, function (listeners) {
          listeners.length = 0;
        });
      });
    });
  }

  function resetOtDoc () {
    if (controller.doc) {
      removeListeners(controller.doc);
    }
    delete controller.doc;
    controller.state.editable = false;
  }


  function setupOtDoc (doc) {
    filterDeletedLocales(doc.snapshot);
    filterDeletedFields(doc.snapshot);
    installListeners(doc);
    controller.doc = doc;
    controller.state.editable = true;
    pathChangeBus.emit([]);
    otUpdateEntityData();
  }

  function filterDeletedLocales (data) {
    _.keys(data.fields).forEach(function (fieldId) {
      _.keys(data.fields[fieldId]).forEach(function (internalCode) {
        if (!_.find(TheLocaleStore.getPrivateLocales(), { internal_code: internalCode })) {
          delete data.fields[fieldId][internalCode];
        }
      });
    });
    return data;
  }

  function filterDeletedFields (data) {
    if (entity.getType() !== 'Entry') {
      return data;
    }

    var ctFields = dotty.get($scope.contentType, 'data.fields');
    if (!ctFields) {
      return data;
    }

    var ctFieldIds = _.map(ctFields, function (field) {
      return field.id;
    });

    _.forEach(data.fields, function (_fieldValue, fieldId) {
      if (ctFieldIds.indexOf(fieldId) < 0) {
        delete data.fields[fieldId];
      }
    });

    return data;
  }

  function updateHandler () {
    if (controller.doc) {
      $scope.$apply(function () {
        entity.setVersion(controller.doc.version);
        entity.data.sys.updatedAt = moment().toISOString();
      });
    }
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

  function installListeners (doc) {
    doc.on('change', emitChangeAtPath);
    doc.on('acknowledge', updateHandler);
  }

  function removeListeners (doc) {
    doc.removeListener('change', emitChangeAtPath);
    doc.removeListener('acknowledge', updateHandler);
  }

  function emitChangeAtPath (ops) {
    ops.forEach(function (op) {
      pathChangeBus.emit(op.p);
    });
  }

  function handleScopeDestruction () {
    if (controller.doc) {
      closeDoc(controller.doc);
      resetOtDoc(controller.doc);
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
}]);
