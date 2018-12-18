import { registerFactory } from 'NgRegistry.es6';
import _ from 'lodash';
import * as K from 'utils/kefir.es6';

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
registerFactory('SnapshotComparatorController/snapshotDoc', [
  '$q',
  'access_control/EntityPermissions.es6',
  ($q, Permissions) => {
    return { create: create };

    function create(data) {
      const permissions = Permissions.create(data.sys);

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

      function valuePropertyAt(path) {
        return K.constant(valueAt(path));
      }

      function valueAt(path) {
        if (Array.isArray(path) && path.length === 0) {
          return data;
        } else {
          return _.get(data, path);
        }
      }
    }
  }
]);
