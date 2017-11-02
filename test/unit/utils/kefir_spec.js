import * as K from 'utils/kefir';
import * as KMock from 'helpers/mocks/kefir';
import * as sinon from 'helpers/sinon';

describe('utils/kefir', function () {
  beforeEach(function () {
    module('ng');
    this.scope = this.$inject('$rootScope').$new();
  });

  describe('#fromScopeEvent()', function () {
    it('emits value when event is fired', function () {
      const stream = K.fromScopeEvent(this.scope, 'event');
      const cb = sinon.stub();
      stream.onValue(cb);
      sinon.assert.notCalled(cb);
      this.scope.$emit('event', 'ARG');
      sinon.assert.calledOnce(cb);
      sinon.assert.calledWithExactly(cb, 'ARG');
    });

    it('emits value array when event is fired and curried', function () {
      const stream = K.fromScopeEvent(this.scope, 'event', true);
      const cb = sinon.stub();
      stream.onValue(cb);
      sinon.assert.notCalled(cb);
      this.scope.$emit('event', 'A', 'B');
      sinon.assert.calledOnce(cb);
      sinon.assert.calledWithExactly(cb, ['A', 'B']);
    });

    it('ends the stream when the scope is destroyed', function () {
      const stream = K.fromScopeEvent(this.scope, 'event');
      const ended = sinon.stub();
      stream.onEnd(ended);
      sinon.assert.notCalled(ended);
      this.scope.$destroy();
      sinon.assert.calledOnce(ended);
    });
  });

  describe('#fromScopeValue()', function () {
    beforeEach(function () {
      this.$scope = this.$inject('$rootScope').$new();
    });

    it('obtains initial value', function () {
      this.$scope.value = {a: true};
      const prop = K.fromScopeValue(this.$scope, (s) => s.value);
      expect(K.getValue(prop)).toEqual({a: true});
    });

    it('updates value', function () {
      this.$scope.value = {a: true};
      const prop = K.fromScopeValue(this.$scope, (s) => s.value);
      this.$scope.value.a = false;
      this.$scope.$apply();
      expect(K.getValue(prop)).toEqual({a: false});
    });

    it('ends property when scope is destroyed', function () {
      this.$scope.value = {a: true};
      const ended = sinon.spy();
      K.fromScopeValue(this.$scope, (s) => s.value).onEnd(ended);
      sinon.assert.notCalled(ended);
      this.$scope.$destroy();
      sinon.assert.calledOnce(ended);
    });
  });

  describe('#onValue()', function () {
    it('calls callback on value', function () {
      const stream = KMock.createMockStream();
      const cb = sinon.spy();
      K.onValue(stream, cb);
      stream.emit('VAL');
      sinon.assert.calledOnce(cb.withArgs('VAL'));
    });

    it('removes callback when detach is called', function () {
      const stream = KMock.createMockStream();
      const cb = sinon.spy();
      const detach = K.onValue(stream, cb);
      stream.emit('VAL');
      sinon.assert.calledOnce(cb);
      detach();
      stream.emit('VAL');
      sinon.assert.calledOnce(cb);
    });
  });

  describe('#onValueScope()', function () {
    it('applies scope after calling callback when value changes', function () {
      const bus = K.createBus();
      const cb = sinon.spy();
      sinon.spy(this.scope, '$applyAsync');
      K.onValueScope(this.scope, bus.stream, cb);
      bus.emit('VAL');
      sinon.assert.calledOnce(cb);
      sinon.assert.calledOnce(this.scope.$applyAsync);
    });

    it('removes callback when scope is destroyed', function () {
      const bus = K.createBus();
      const cb = sinon.spy();
      K.onValueScope(this.scope, bus.stream, cb);
      bus.emit('VAL');
      this.$apply();
      sinon.assert.calledOnce(cb);
      this.scope.$destroy();
      bus.emit('VAL');
      this.$apply();
      sinon.assert.calledOnce(cb);
    });
  });

  describe('#onValueWhile()', function () {
    it('does not call callback when lifeline has ended', function () {
      const stream = KMock.createMockStream();
      const lifeline = KMock.createMockStream();
      const cb = sinon.spy();
      K.onValueWhile(lifeline, stream, cb);
      stream.emit('VAL');
      sinon.assert.calledOnce(cb);

      cb.reset();
      lifeline.end();
      stream.emit('VAL2');
      sinon.assert.notCalled(cb);
    });
  });

  describe('#createBus()', function () {
    it('emits value events', function () {
      const bus = K.createBus();
      const cb = sinon.spy();
      bus.stream.onValue(cb);
      bus.emit('VAL');
      sinon.assert.calledOnce(cb);
      sinon.assert.calledWithExactly(cb, 'VAL');
    });

    it('emits end event', function () {
      const bus = K.createBus();
      const cb = sinon.spy();
      bus.stream.onEnd(cb);
      bus.end();
      sinon.assert.calledOnce(cb);
    });

    it('ends when attached scope is destroyed', function () {
      const bus = K.createBus(this.scope);
      const cb = sinon.spy();
      bus.stream.onEnd(cb);
      this.scope.$destroy();
      sinon.assert.calledOnce(cb);
    });
  });

  describe('#createPropertyBus()', function () {
    it('emits initial value', function () {
      const bus = K.createPropertyBus('INIT');
      const cb = sinon.spy();
      bus.property.onValue(cb);
      sinon.assert.calledWithExactly(cb, 'INIT');
    });

    it('set value when subscribing later', function () {
      const bus = K.createPropertyBus('INIT');
      bus.set('VAL');
      const cb = sinon.spy();
      bus.property.onValue(cb);
      sinon.assert.calledWithExactly(cb, 'VAL');
    });
  });

  describe('#sampleBy()', function () {
    it('samples new value when event is fired', function () {
      const obs = KMock.createMockStream();
      const sampler = sinon.stub();
      const prop = K.sampleBy(obs, sampler);

      sampler.returns('INITIAL');
      const values = KMock.extractValues(prop);

      sampler.returns('VAL');
      obs.emit();
      expect(values).toEqual(['VAL', 'INITIAL']);
    });
  });

  describe('#promiseProperty', function () {
    it('is set to "Pending" initially', function* () {
      const deferred = makeDeferred();
      const prop = K.promiseProperty(deferred.promise, 'PENDING');
      const values = KMock.extractValues(prop);
      expect(values[0]).toBeInstanceOf(K.PromiseStatus.Pending);
      expect(values[0].value).toBe('PENDING');
    });

    it('is set to "Resolved" when promise resolves', function* () {
      const deferred = makeDeferred();
      const prop = K.promiseProperty(deferred.promise, 'PENDING');
      const values = KMock.extractValues(prop);

      deferred.resolve('SUCCESS');
      yield deferred.promise;
      expect(values[0]).toBeInstanceOf(K.PromiseStatus.Resolved);
      expect(values[0].value).toBe('SUCCESS');
    });

    it('is set to "Resolved" when promise resolves', function* () {
      const deferred = makeDeferred();
      const prop = K.promiseProperty(deferred.promise, 'PENDING');
      const values = KMock.extractValues(prop);

      deferred.reject('ERROR');
      yield deferred.promise.catch(() => null);
      expect(values[0]).toBeInstanceOf(K.PromiseStatus.Rejected);
      expect(values[0].error).toBe('ERROR');
    });

    function makeDeferred () {
      let _resolve, _reject;
      const promise = new Promise((resolve, reject) => {
        _resolve = resolve;
        _reject = reject;
      });
      return {
        promise: promise,
        resolve: _resolve,
        reject: _reject
      };
    }
  });

  describe('#combinePropertiesObject()', function () {
    it('combines the state as an object', function () {
      const a = KMock.createMockProperty('A1');
      const b = KMock.createMockProperty('B1');
      const x = K.combinePropertiesObject({a, b});
      KMock.assertCurrentValue(x, {a: 'A1', b: 'B1'});

      b.set('B2');
      KMock.assertCurrentValue(x, {a: 'A1', b: 'B2'});

      a.set('A2');
      KMock.assertCurrentValue(x, {a: 'A2', b: 'B2'});
    });
  });

  describe('#getValue', function () {
    it('returns current value', function () {
      const prop = KMock.createMockProperty('A');
      expect(K.getValue(prop)).toBe('A');
      prop.set('B');
      expect(K.getValue(prop)).toBe('B');
    });

    it('returns last value when property has ended', function () {
      const prop = KMock.createMockProperty('A');
      prop.set('B');
      prop.end();
      expect(K.getValue(prop)).toBe('B');
    });

    it('throws if there is no current value', function () {
      const prop = KMock.createMockStream();
      expect(() => K.getValue(prop)).toThrowError('Property does not have current value');
    });
  });

  describe('#holdWhen', function () {
    it('emits values until predicate is true', function () {
      const prop = KMock.createMockProperty('A');

      const hold = K.holdWhen(prop, (x) => x === 'X');
      KMock.assertCurrentValue(hold, 'A');

      prop.set('B');
      KMock.assertCurrentValue(hold, 'B');

      prop.set('X');
      KMock.assertCurrentValue(hold, 'X');

      prop.set('Y');
      KMock.assertCurrentValue(hold, 'X');
    });

    it('ends after predicate is true', function () {
      const prop = KMock.createMockProperty('A');
      const hold = K.holdWhen(prop, (x) => x === 'X');

      const ended = sinon.spy();
      hold.onEnd(ended);
      prop.set('X');
      sinon.assert.calledOnce(ended);
    });
  });

  describe('#scopeLifeline', function () {
    beforeEach(function () {
      this.scope = this.$inject('$rootScope').$new();
    });

    it('ends when subscribing before being destroyed', function () {
      const ended = sinon.spy();
      K.scopeLifeline(this.scope).onEnd(ended);
      sinon.assert.notCalled(ended);
      this.scope.$destroy();
      sinon.assert.called(ended);
    });

    it('ends when subscribing after being destroyed', function () {
      const ended = sinon.spy();
      this.scope.$destroy();
      K.scopeLifeline(this.scope).onEnd(ended);
      sinon.assert.called(ended);
    });
  });

  describe('#endWith', function () {
    beforeEach(function () {
      this.prop = KMock.createMockProperty('A');
      this.lifeline = KMock.createMockStream();
      this.result = K.endWith(this.prop, this.lifeline);
    });

    it('holds original property values', function () {
      KMock.assertCurrentValue(this.result, 'A');
      this.prop.set('B');
      KMock.assertCurrentValue(this.result, 'B');
    });

    it('ends when property ends', function () {
      const ended = sinon.spy();
      this.result.onEnd(ended);
      this.prop.end();
      sinon.assert.called(ended);
    });

    it('ends when lifeline ends', function () {
      const ended = sinon.spy();
      this.result.onEnd(ended);
      this.lifeline.end();
      sinon.assert.called(ended);
    });
  });
});
