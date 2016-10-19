'use strict';

angular.module('cf.app')
/**
 * @ngdoc service
 * @module cf.app
 * @name SnapshotComparatorController/snapshotDoc
 * @description
 * Given the entry data, it returns a fake
 * instance of "entityEditor/Document".
 *
 * Values at paths are created from the
 * data provided, but all mutating methods
 * are no-ops.
 */
.factory('SnapshotComparatorController/snapshotDoc', ['require', function (require) {
  var K = require('utils/kefir');
  var $q = require('$q');

  return {create: create};

  function create (data) {
    return {
      getValueAt: valueAt,
      valuePropertyAt: valuePropertyAt,
      setValueAt: $q.resolve,
      removeValueAt: $q.resolve,
      insertValueAt: $q.resolve,
      pushValueAt: $q.resolve,
      moveValueAt: $q.resolve,
      sysProperty: K.constant(data.sys),
      changes: K.constant([]),
      collaboratorsFor: _.constant(K.constant([])),
      notifyFocus: _.noop,
      setReadOnly: _.noop
    };

    function valuePropertyAt (path) {
      return K.constant(valueAt(path));
    }

    function valueAt (path) {
      return dotty.get(data, path);
    }
  }
}]);
