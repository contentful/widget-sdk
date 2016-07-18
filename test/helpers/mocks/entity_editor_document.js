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
  var K = require('mocks/kefir');
  var OtDoc = require('mocks/OtDoc');
  var $q = require('$q');

  return {
    create: create
  };

  function create (data) {
    data = data || {};

    return {
      doc: new OtDoc(data),
      state: {
        isDirty: K.createMockProperty()
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
      sysProperty: K.createMockProperty(dotty.get(data, 'sys'))
    };

    function insertValueAt (path, pos, val) {
      var list = dotty.get(data, path, []);
      list.splice(pos, 0, val);
      dotty.put(data, path, list);
      return $q.resolve(val);
    }

    function pushValueAt (path, val) {
      var list = dotty.get(data, path, []);
      list.push(val);
      dotty.put(data, path, list);
      return $q.resolve(val);
    }

    function moveValueAt (path, from, to) {
      var list = dotty.get(data, path, []);
      let [val] = list.splice(from, 1);
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
