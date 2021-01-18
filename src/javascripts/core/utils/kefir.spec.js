import * as K from 'core/utils/kefir';
import * as KMock from '../../../../test/utils/kefir';

describe('core/utils/kefir', () => {
  let $rootScope, events;
  beforeEach(async function () {
    events = {
      $destroy: jest.fn(),
    };
    $rootScope = {
      $on: (event, callback) => (events[event] = callback),
      $emit: (...args) => events[args[0]](...args),
      $destroy: (...args) => events['$destroy'](...args),
      $watch: jest.fn(),
      $apply: jest.fn(),
      $applyAsync: jest.fn(),
    };
  });

  describe('#fromScopeEvent()', () => {
    it('emits value when event is fired', function () {
      const stream = K.fromScopeEvent($rootScope, 'event');
      const cb = jest.fn();
      stream.onValue(cb);
      expect(cb).not.toHaveBeenCalled();
      $rootScope.$emit('event', 'ARG');
      expect(cb).toHaveBeenCalledTimes(1);
      expect(cb).toHaveBeenCalledWith('ARG');
    });

    it('emits value array when event is fired and curried', function () {
      const stream = K.fromScopeEvent($rootScope, 'event', true);
      const cb = jest.fn();
      stream.onValue(cb);
      expect(cb).not.toHaveBeenCalled();
      $rootScope.$emit('event', 'A', 'B');
      expect(cb).toHaveBeenCalledTimes(1);
      expect(cb).toHaveBeenCalledWith(['A', 'B']);
    });

    it('ends the stream when the $rootScope is destroyed', function () {
      const stream = K.fromScopeEvent($rootScope, 'event');
      const ended = jest.fn();
      stream.onEnd(ended);
      expect(ended).not.toHaveBeenCalled();
      $rootScope.$destroy();
      expect(ended).toHaveBeenCalledTimes(1);
    });
  });

  describe('#fromScopeValue()', () => {
    it('obtains initial value', function () {
      $rootScope.value = { a: true };
      const prop = K.fromScopeValue($rootScope, (s) => s.value);
      expect(K.getValue(prop)).toEqual({ a: true });
    });

    it('updates value', function () {
      $rootScope.value = { a: true };
      const prop = K.fromScopeValue($rootScope, (s) => s.value);
      $rootScope.value.a = false;
      $rootScope.$apply();
      expect(K.getValue(prop)).toEqual({ a: false });
    });

    it('ends property when $rootScope is destroyed', function () {
      $rootScope.value = { a: true };
      const ended = jest.fn();
      K.fromScopeValue($rootScope, (s) => s.value).onEnd(ended);
      expect(ended).not.toHaveBeenCalled();
      $rootScope.$destroy();
      expect(ended).toHaveBeenCalledTimes(1);
    });
  });

  describe('#onValue()', () => {
    it('calls callback on value', () => {
      const stream = KMock.createMockStream();
      const cb = jest.fn();
      K.onValue(stream, cb);
      stream.emit('VAL');
      expect(cb).toHaveBeenCalledWith('VAL');
    });

    it('removes callback when detach is called', () => {
      const stream = KMock.createMockStream();
      const cb = jest.fn();
      const detach = K.onValue(stream, cb);
      stream.emit('VAL');
      expect(cb).toHaveBeenCalledTimes(1);
      detach();
      stream.emit('VAL');
      expect(cb).toHaveBeenCalledTimes(1);
    });
  });

  describe('#onValueScope()', () => {
    it('applies $rootScope after calling callback when value changes', function () {
      const bus = K.createBus();
      const cb = jest.fn();
      K.onValueScope($rootScope, bus.stream, cb);
      bus.emit('VAL');
      expect(cb).toHaveBeenCalledTimes(1);
      expect($rootScope.$applyAsync).toHaveBeenCalledTimes(1);
    });

    it('removes callback when $rootScope is destroyed', function () {
      const bus = K.createBus();
      const cb = jest.fn();
      K.onValueScope($rootScope, bus.stream, cb);
      bus.emit('VAL');
      // $apply();
      expect(cb).toHaveBeenCalledTimes(1);
      $rootScope.$destroy();
      bus.emit('VAL');
      // $apply();
      expect(cb).toHaveBeenCalledTimes(1);
    });
  });

  describe('#onValueWhile()', () => {
    it('does not call callback when lifeline has ended', () => {
      const stream = KMock.createMockStream();
      const lifeline = KMock.createMockStream();
      const cb = jest.fn();
      K.onValueWhile(lifeline, stream, cb);
      stream.emit('VAL');
      expect(cb).toHaveBeenCalledTimes(1);

      cb.mockClear();
      lifeline.end();
      stream.emit('VAL2');
      expect(cb).not.toHaveBeenCalled();
    });
  });

  describe('#createBus()', () => {
    it('emits value events', () => {
      const bus = K.createBus();
      const cb = jest.fn();
      bus.stream.onValue(cb);
      bus.emit('VAL');
      expect(cb).toHaveBeenCalledTimes(1);
      expect(cb).toHaveBeenCalledWith('VAL');
    });

    it('emits end event', () => {
      const bus = K.createBus();
      const cb = jest.fn();
      bus.stream.onEnd(cb);
      bus.end();
      expect(cb).toHaveBeenCalledTimes(1);
    });

    it('ends when attached $rootScope is destroyed', function () {
      const bus = K.createBus($rootScope);
      const cb = jest.fn();
      bus.stream.onEnd(cb);
      $rootScope.$destroy();
      expect(cb).toHaveBeenCalledTimes(1);
    });
  });

  describe('#createPropertyBus()', () => {
    it('emits initial value', () => {
      const bus = K.createPropertyBus('INIT');
      const cb = jest.fn();
      bus.property.onValue(cb);
      expect(cb).toHaveBeenCalledWith('INIT');
    });

    it('set value when subscribing later', () => {
      const bus = K.createPropertyBus('INIT');
      bus.set('VAL');
      const cb = jest.fn();
      bus.property.onValue(cb);
      expect(cb).toHaveBeenCalledWith('VAL');
    });
  });

  describe('#sampleBy()', () => {
    it('samples new value when event is fired', () => {
      const obs = KMock.createMockStream();
      const sampler = jest.fn();
      const prop = K.sampleBy(obs, sampler);

      sampler.mockReturnValue('INITIAL');
      const values = KMock.extractValues(prop);

      sampler.mockReturnValue('VAL');
      obs.emit();
      expect(values).toEqual(['VAL', 'INITIAL']);
    });
  });

  describe('#promiseProperty', () => {
    it('is set to "Pending" initially', function () {
      const deferred = makeDeferred();
      const prop = K.promiseProperty(deferred.promise, 'PENDING');
      const values = KMock.extractValues(prop);
      expect(values[0]).toBeInstanceOf(K.PromiseStatus.Pending);
      expect(values[0].value).toBe('PENDING');
    });

    it('is set to "Resolved" when promise resolves', async function () {
      const deferred = makeDeferred();
      const prop = K.promiseProperty(deferred.promise, 'PENDING');
      const values = KMock.extractValues(prop);

      deferred.resolve('SUCCESS');
      await deferred.promise;
      expect(values[0]).toBeInstanceOf(K.PromiseStatus.Resolved);
      expect(values[0].value).toBe('SUCCESS');
    });

    it('is set to "Rejected" when promise rejects', async function () {
      const deferred = makeDeferred();
      const prop = K.promiseProperty(deferred.promise, 'PENDING');
      const values = KMock.extractValues(prop);

      deferred.reject('ERROR');
      await deferred.promise.catch(() => null);
      expect(values[0]).toBeInstanceOf(K.PromiseStatus.Rejected);
      expect(values[0].error).toBe('ERROR');
    });

    function makeDeferred() {
      let _resolve, _reject;
      const promise = new Promise((resolve, reject) => {
        _resolve = resolve;
        _reject = reject;
      });
      return {
        promise: promise,
        resolve: _resolve,
        reject: _reject,
      };
    }
  });

  describe('#combinePropertiesObject()', () => {
    it('combines the state as an object', () => {
      const a = KMock.createMockProperty('A1');
      const b = KMock.createMockProperty('B1');
      const x = K.combinePropertiesObject({ a, b });
      KMock.assertCurrentValue(x, { a: 'A1', b: 'B1' });

      b.set('B2');
      KMock.assertCurrentValue(x, { a: 'A1', b: 'B2' });

      a.set('A2');
      KMock.assertCurrentValue(x, { a: 'A2', b: 'B2' });
    });
  });

  describe('#getValue', () => {
    it('returns current value', () => {
      const prop = KMock.createMockProperty('A');
      expect(K.getValue(prop)).toBe('A');
      prop.set('B');
      expect(K.getValue(prop)).toBe('B');
    });

    it('returns last value when property has ended', () => {
      const prop = KMock.createMockProperty('A');
      prop.set('B');
      prop.end();
      expect(K.getValue(prop)).toBe('B');
    });

    it('throws if there is no current value', () => {
      const prop = KMock.createMockStream();
      expect(() => K.getValue(prop)).toThrowError('Property does not have current value');
    });
  });

  describe('#scopeLifeline', () => {
    it('ends when subscribing before being destroyed', function () {
      const ended = jest.fn();
      K.scopeLifeline($rootScope).onEnd(ended);
      expect(ended).not.toHaveBeenCalled();
      $rootScope.$destroy();
      expect(ended).toHaveBeenCalled();
    });

    it('ends when subscribing after being destroyed', function () {
      const ended = jest.fn();
      K.scopeLifeline($rootScope).onEnd(ended);
      $rootScope.$destroy();
      expect(ended).toHaveBeenCalled();
    });
  });

  describe('#endWith', () => {
    let prop;
    let lifeline;
    let result;
    beforeEach(function () {
      prop = KMock.createMockProperty('A');
      lifeline = KMock.createMockStream();
      result = K.endWith(prop, lifeline);
    });

    it('holds original property values', function () {
      KMock.assertCurrentValue(result, 'A');
      prop.set('B');
      KMock.assertCurrentValue(result, 'B');
    });

    it('ends when property ends', function () {
      const ended = jest.fn();
      result.onEnd(ended);
      prop.end();
      expect(ended).toHaveBeenCalled();
    });

    it('ends when lifeline ends', function () {
      const ended = jest.fn();
      result.onEnd(ended);
      lifeline.end();
      expect(ended).toHaveBeenCalled();
    });
  });
});
