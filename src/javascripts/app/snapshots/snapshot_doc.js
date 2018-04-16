'use strict';

angular.module('cf.app')
/**
 * @ngdoc service
 * @module cf.app
 * @name SnapshotComparatorController/snapshotDoc
 * @description
 * Given the entry data, it returns a fake
 * instance of 'app/entity_editor/Document'.
 *
 * Values at paths are created from the
 * data provided, but all mutating methods
 * are no-ops.
 */
.factory('SnapshotComparatorController/snapshotDoc', ['require', function (require) {
  var K = require('utils/kefir');
  var $q = require('$q');
  var Permissions = require('access_control/EntityPermissions');

  return {create: create};

  function create (data) {
    var permissions = Permissions.create(data.sys);

    return {
      state: {
        isConnected$: K.constant(false)
      },
      permissions: permissions,
      getValueAt: valueAt,
      valuePropertyAt: valuePropertyAt,
      setValueAt: $q.resolve,
      removeValueAt: $q.resolve,
      insertValueAt: $q.resolve,
      pushValueAt: $q.resolve,
      moveValueAt: $q.resolve,
      sysProperty: K.constant(data.sys),
      changes: K.constant([]),
      localFieldChanges$: K.never(),
      collaboratorsFor: _.constant(K.constant([])),
      notifyFocus: _.noop,
      setReadOnly: _.noop
    };

    function valuePropertyAt (path) {
      return K.constant(valueAt(path));
    }

    function valueAt (path) {
      if (Array.isArray(path) && path.length === 0) {
        return data;
      } else {
        return _.get(data, path);
      }
    }
  }
}]);
