'use strict';

angular.module('contentful/mocks')
/**
 * @ngdoc service
 * @module contentful/mocks
 * @name mocks/entityEditor/Document
 * @description
 * Create a mock implementation of `entityEditor/Document`.
 *
 * TODO at some point we should mock this by using the correct
 * implementation with just the ShareJS Doc mock
 */
.factory('mocks/entityEditor/Document', ['require', function (require) {
  const K = require('mocks/kefir');
  const $q = require('$q');

  return {
    create: create
  };

  function create (initialData) {
    let currentData;
    const data$ = K.createMockProperty(initialData || {
      sys: {
        type: 'Entry',
        id: 'EID'
      }
    });
    data$.onValue(function (data) {
      currentData = data;
    });

    const reverter = {
      hasChanges: sinon.stub(),
      revert: sinon.stub().resolves()
    };

    const permissions = {
      can: sinon.stub().returns(true),
      canEditFieldLocale: sinon.stub().returns(true)
    };

    return {
      destroy: _.noop,
      getVersion: sinon.stub(),

      state: {
        isDirty$: K.createMockProperty(),
        isSaving$: K.createMockProperty(false),
        isConnected$: K.createMockProperty(true)
      },

      getValueAt: sinon.spy(getValueAt),

      setValueAt: sinon.spy(setValueAt),
      removeValueAt: sinon.spy(function (path) {
        return setValueAt(path, undefined);
      }),
      insertValueAt: sinon.spy(insertValueAt),
      pushValueAt: sinon.spy(pushValueAt),
      moveValueAt: sinon.spy(moveValueAt),

      // TODO should emit when calling setters
      changes: K.createMockStream(),
      valuePropertyAt: sinon.spy(valuePropertyAt),
      sysProperty: valuePropertyAt(['sys']),

      collaboratorsFor: sinon.stub().returns(K.createMockProperty([])),
      notifyFocus: sinon.spy(),

      reverter: reverter,
      permissions: permissions
    };

    function getValueAt (path) {
      return _.cloneDeep(dotty.get(currentData, path));
    }

    function valuePropertyAt (path) {
      return data$.map(function (data) {
        return _.cloneDeep(dotty.get(data, path));
      });
    }

    function insertValueAt (path, pos, val) {
      const list = getValueAt(path);
      list.splice(pos, 0, val);
      setValueAt(path, list);
      return $q.resolve(val);
    }

    function pushValueAt (path, val) {
      const list = getValueAt(path);
      list.push(val);
      setValueAt(path, list);
      return $q.resolve(val);
    }

    function moveValueAt (path, from, to) {
      const list = getValueAt(path);
      const [val] = list.splice(from, 1);
      list.splice(to, 0, val);
      setValueAt(path, list);
      return $q.resolve();
    }

    function setValueAt (path, value) {
      const data = _.cloneDeep(currentData);
      dotty.put(data, path, value);
      data$.set(data);
      return $q.resolve(value);
    }
  }
}]);
