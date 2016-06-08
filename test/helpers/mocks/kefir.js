'use strict';

angular.module('contentful/mocks')
.factory('mocks/kefir', ['require', function (require) {
  var Kefir = require('utils/kefir');

  return Object.assign({
    createMockProperty: createMockProperty,
    createMockStream: createMockStream
  }, Kefir);

  function createMockProperty () {
    var bus = Kefir.createBus();
    var current;
    var property = bus.stream.toProperty(function () {
      return current;
    });
    property.end = bus.end;
    property.set = function (value) {
      current = value;
      bus.emit(value);
    };
    return property;
  }

  function createMockStream () {
    var bus = Kefir.createBus();
    bus.stream.end = bus.end;
    bus.stream.emit = bus.emit;
    return bus.stream;
  }
}]);
