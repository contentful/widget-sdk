'use strict';

describe('List Actions', function () {
  var serialize, $timeout, $q;

  beforeEach(module('contentful/test'));

  beforeEach(inject(function (listActions, _$timeout_, _$q_) {
    serialize = listActions.serialize;
    $timeout = _$timeout_;
    $q = _$q_;
  }));

  it('serializes http calls for rate limiting', function () {
    var messages = [];
    var result;
    var hasFailed  = false;
    serialize([
      function number1(){ return $timeout(function () {
        messages.push('number 1');
        return 1;
      }, 500);},
      function number2(){ return $timeout(function () {
        messages.push('number 2');
        return 2;
      }, 100);},
      function number3f(){ return $timeout(function () {
        if (hasFailed) {
          messages.push('failing number 3 succeeded');
          return 3;
        } else {
          hasFailed = true;
          messages.push('failing number 3 with 429');
          return $q.reject({statusCode: 429});
        }
      }, 200);},
      function number3(){ return $timeout(function () {
        messages.push('number 4');
        return 4;
      }, 500); }
    ]).then(function (res) {
      result = res;
    });

    $timeout.flush(); // Flush the call of number 1
    expect(messages[0]).toBe('number 1');
    $timeout.flush(); // Flush the call of number 2
    expect(messages[1]).toBe('number 2');
    $timeout.flush(); // Flush the call of failing number 3
    expect(messages[2]).toBe('failing number 3 with 429');
    $timeout.flush(); // Flush the call of the number 3 retry timeout
    $timeout.flush(); // Flush the call of the number 3 retry
    expect(messages[3]).toBe('failing number 3 succeeded');
    $timeout.flush(); // Flush the call of number 4
    expect(messages[4]).toBe('number 4');
    expect(messages.length).toBe(5);

    expect(result).toEqual([1,2,3,4]);
  });

  it('aborts on serious error', function () {
    var messages = [];
    serialize([
      function number1(){ return $timeout(function () {
        messages.push('number 1');
      }, 500);},
      function number2(){ return $timeout(function () {
        messages.push('number 2');
      }, 100);},
      function number3f(){ return $timeout(function () {
        messages.push('failing number 3');
        return $q.reject({statusCode: 404});
      }, 200);},
      function number3(){ return $timeout(function () {
        messages.push('number 3');
      }, 500); }
    ]).catch(function (err) {
      messages.push(err);
    });

    $timeout.flush(); // Flush the call of number 1
    expect(messages[0]).toBe('number 1');
    $timeout.flush(); // Flush the call of number 2
    expect(messages[1]).toBe('number 2');
    $timeout.flush(); // Flush the call of failing number 3
    expect(messages[2]).toBe('failing number 3');
    expect(messages[3].statusCode).toBe(404);
    expect(messages.length).toBe(4);
  });

  it('returns empty array with empty calls', function () {
    var result;
    serialize([]).then(function (res) {
      result = res;
    });

    $timeout.flush();
    expect(result).toEqual([]);
  });
});
