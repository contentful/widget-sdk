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
      changes: K.createMockStream(),
      valuePropertyAt: sinon.spy(_.memoize(function (path) {
        return K.createMockProperty(dotty.get(data, path));
      }, function hashPath (path) {
        return path.join('!');
      })),
      sysProperty: K.createMockProperty(dotty.get(data, 'sys'))
    };

    function setValueAt (path, value) {
      dotty.put(data, path, value);
      return $q.resolve(value);
    }
  }
}]);
