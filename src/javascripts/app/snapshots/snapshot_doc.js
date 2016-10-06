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
  var resolve = _.constant($q.resolve());

  return {create: create};

  function create (data) {
    return {
      getValueAt: valueAt,
      valuePropertyAt: valuePropertyAt,
      setValueAt: resolve,
      removeValueAt: resolve,
      insertValueAt: resolve,
      pushValueAt: resolve,
      moveValueAt: resolve,
      collaboratorsFor: _.constant(K.constant([]))
    };

    function valuePropertyAt (path) {
      return K.constant(valueAt(path));
    }

    function valueAt (path) {
      return dotty.get(data, path);
    }
  }
}]);
