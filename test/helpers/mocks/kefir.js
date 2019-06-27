import * as Kefir from 'utils/kefir.es6';

export * from 'utils/kefir.es6';

/**
 * Returns an array that dynamically updates when the stream or
 * property emits a new value. The new value is prepended to the
 * array.
 */
export function extractValues(stream) {
  const values = [];
  stream.onValue(x => values.unshift(x));
  return values;
}

export function createMockProperty(initial) {
  const { property, end, set, error } = Kefir.createPropertyBus(initial);
  property.end = end;
  property.set = set;
  property.error = error;
  return property;
}

export function createMockStream() {
  const bus = Kefir.createBus();
  bus.stream.end = bus.end;
  bus.stream.emit = bus.emit;
  return bus.stream;
}

export function assertCurrentValue(prop, expected) {
  let called = false;
  let actual;
  const off = Kefir.onValue(prop, value => {
    actual = value;
    called = true;
  });
  off();
  expect(called).toBe(true, 'Observable does not have current value');
  expect(actual).toEqual(expected);
}

export function assertMatchCurrentValue(prop, matcher) {
  let called = false;
  let actual;
  const off = Kefir.onValue(prop, value => {
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
