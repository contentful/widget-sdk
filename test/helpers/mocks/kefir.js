'use strict';

angular.module('contentful/mocks')
.factory('mocks/kefir', ['require', function (require) {
  const Kefir = require('utils/kefir');

  return Object.assign({
    createMockProperty: createMockProperty,
    createMockStream: createMockStream,
    extractValues: extractValues,
    assertCurrentValue: assertCurrentValue,
    assertMatchCurrentValue: assertMatchCurrentValue
  }, Kefir);

  /**
   * Returns an array that dynamically updates when the stream or
   * property emits a new value. The new value is prepended to the
   * array.
   */
  function extractValues (stream) {
    const values = [];
    stream.onValue((x) => values.unshift(x));
    return values;
  }

  function createMockProperty (initial) {
    const bus = Kefir.createBus();
    let current = initial;
    const property = bus.stream.toProperty(function () {
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
    const bus = Kefir.createBus();
    bus.stream.end = bus.end;
    bus.stream.emit = bus.emit;
    return bus.stream;
  }

  function assertCurrentValue (prop, expected) {
    let called = false;
    let actual;
    const off = Kefir.onValue(prop, function (value) {
      actual = value;
      called = true;
    });
    off();
    expect(called).toBe(true, 'Observable does not have current value');
    expect(actual).toEqual(expected);
  }

  function assertMatchCurrentValue (prop, matcher) {
    let called = false;
    let actual;
    const off = Kefir.onValue(prop, function (value) {
      actual = value;
      called = true;
    });
    off();
    expect(called).toBe(true, 'Observable does not have current value');
    if (!matcher.test(actual)) {
      throw new Error(
        'Observable value did not match\n' +
        `  expected ${jasmine.pp(actual)}\n` +
        `  to match ${matcher.message}\n`
      );
    }
  }
}]);
