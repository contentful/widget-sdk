'use strict';

angular.module('contentful/mocks')
/**
 * @ngdoc service
 * @module contentful/mocks
 * @name mocks/entityEditor/Document
 * @description
 * Create a mock implementation of `entityEditor/Document`.
 */
.factory('mocks/entityEditor/Document', ['require', function (require) {
  const K = require('mocks/kefir');
  const OtDoc = require('mocks/OtDoc');
  const $q = require('$q');

  return {
    create: create
  };

  function create (data) {
    data = data || {sys: {}};

    return {
      doc: new OtDoc(data),
      state: {
        isDirty$: K.createMockProperty(),
        isSaving$: K.createMockProperty(false),
        isConnected$: K.createMockProperty(true)
      },

      open: sinon.stub(),
      close: sinon.stub(),

      getValueAt: sinon.spy(function (path) {
        return dotty.get(data, path);
      }),

      // TODO this should trigger an event on valuePropertyAt
      setValueAt: sinon.spy(setValueAt),
      removeValueAt: sinon.spy(function (path) {
        return setValueAt(path, undefined);
      }),
      insertValueAt: sinon.spy(insertValueAt),
      pushValueAt: sinon.spy(pushValueAt),
      moveValueAt: sinon.spy(moveValueAt),

      changes: K.createMockStream(),
      valuePropertyAt: sinon.spy(_.memoize(function (path) {
        return K.createMockProperty(dotty.get(data, path));
      }, function hashPath (path) {
        return path.join('!');
      })),
      sysProperty: K.createMockProperty(data.sys),

      reverter: {
        hasChanges: sinon.stub(),
        revert: sinon.stub().resolves()
      },

      collaboratorsFor: sinon.stub().returns(K.createMockProperty([])),
      notifyFocus: sinon.spy()
    };

    function insertValueAt (path, pos, val) {
      const list = dotty.get(data, path, []);
      list.splice(pos, 0, val);
      dotty.put(data, path, list);
      return $q.resolve(val);
    }

    function pushValueAt (path, val) {
      const list = dotty.get(data, path, []);
      list.push(val);
      dotty.put(data, path, list);
      return $q.resolve(val);
    }

    function moveValueAt (path, from, to) {
      const list = dotty.get(data, path, []);
      const [val] = list.splice(from, 1);
      list.splice(to, 0, val);
      dotty.put(data, path, list);
      return $q.resolve();
    }

    function setValueAt (path, value) {
      dotty.put(data, path, value);
      return $q.resolve(value);
    }
  }
}]);
