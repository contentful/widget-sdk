import * as CallBuffer from './CallBuffer.es6';

describe('utils/CallBuffer', () => {
  it('should record and playback calls', function() {
    const buffer = CallBuffer.create();
    const results = [];
    buffer.call(() => {
      results.push(1);
    });
    buffer.call(() => {
      results.push(2);
    });
    buffer.call(() => {
      results.push(3);
    });
    expect(results).toHaveLength(0);
    buffer.resolve();
    expect(results).toEqual([1, 2, 3]);
  });

  it('should immediately execute calls after being resolved', function() {
    const buffer = CallBuffer.create();
    const results = [];
    buffer.resolve();
    buffer.call(() => {
      results.push(1);
    });
    buffer.call(() => {
      results.push(2);
    });
    buffer.call(() => {
      results.push(3);
    });
    expect(results).toEqual([1, 2, 3]);
  });

  it('should not resolve if it has been disabled', function() {
    const buffer = CallBuffer.create();
    const results = [];
    buffer.disable();
    buffer.call(() => {
      results.push(1);
    });
    buffer.call(() => {
      results.push(2);
    });
    buffer.call(() => {
      results.push(3);
    });
    expect(results).toEqual([]);
  });

  it('provides a service passed to #resolve when executing fn', function() {
    const buffer = CallBuffer.create();
    const service = { counter: 1 };
    buffer.resolve(service);
    buffer.call(service => {
      service.counter += 1;
    });
    buffer.call(service => {
      service.counter += 3;
    });
    expect(service.counter).toBe(5);
  });
});
