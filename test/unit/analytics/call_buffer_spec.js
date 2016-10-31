'use strict';

describe('CallBuffer', function () {
  beforeEach(function () {
    module('contentful/test');
    this.create = this.$inject('CallBuffer').create;
  });

  it('should record and playback calls', function () {
    const buffer = this.create();
    const results = [];
    buffer.call(function () { results.push(1); });
    buffer.call(function () { results.push(2); });
    buffer.call(function () { results.push(3); });
    expect(results.length).toBe(0);
    buffer.resolve();
    expect(results).toEqual([1, 2, 3]);
  });

  it('should immediately execute calls after being resolved', function () {
    const buffer = this.create();
    const results = [];
    buffer.resolve();
    buffer.call(function () { results.push(1); });
    buffer.call(function () { results.push(2); });
    buffer.call(function () { results.push(3); });
    expect(results).toEqual([1, 2, 3]);
  });

  it('should not resolve if it has been disabled', function () {
    const buffer = this.create();
    const results = [];
    buffer.disable();
    buffer.call(function () { results.push(1); });
    buffer.call(function () { results.push(2); });
    buffer.call(function () { results.push(3); });
    expect(results).toEqual([]);
  });
});
