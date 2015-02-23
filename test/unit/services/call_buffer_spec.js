'use strict';

describe('CallBuffer service', function(){
  beforeEach(function(){
    module('contentful/test');
    this.CallBuffer = this.$inject('CallBuffer');
  });

  it('should record and playback calls', function() {
    var buffer = new this.CallBuffer();
    var results = [];
    buffer.call(function(){ results.push(1); });
    buffer.call(function(){ results.push(2); });
    buffer.call(function(){ results.push(3); });
    expect(results.length).toBe(0);
    buffer.resolve();
    expect(results).toEqual([1,2,3]);
  });

  it('should immediately execute calls after being resolved', function() {
    var buffer = new this.CallBuffer();
    var results = [];
    buffer.resolve();
    buffer.call(function(){ results.push(1); });
    buffer.call(function(){ results.push(2); });
    buffer.call(function(){ results.push(3); });
    expect(results).toEqual([1,2,3]);
  });

  it('should not resolve if it has been disabled', function() {
    var buffer = new this.CallBuffer();
    var results = [];
    buffer.disable();
    buffer.call(function(){ results.push(1); });
    buffer.call(function(){ results.push(2); });
    buffer.call(function(){ results.push(3); });
    expect(results).toEqual([]);
  });

});

