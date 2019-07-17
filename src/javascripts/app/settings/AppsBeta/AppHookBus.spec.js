import { makeAppHookBus } from './AppHookBus.es6';

describe('AppHookBus', () => {
  it('exposes even emitter', () => {
    const bus = makeAppHookBus();

    const xSpy = jest.fn();
    const ySpy = jest.fn();

    bus.on('x', xSpy);
    bus.on('y', ySpy);

    bus.emit('x', { test: true });
    bus.emit('x');
    bus.emit('y', 'whyyy?');

    expect(xSpy).toBeCalledTimes(2);
    expect(ySpy).toBeCalledTimes(1);

    expect(xSpy).toBeCalledWith({ test: true });
    expect(xSpy).toBeCalledWith(undefined);
    expect(ySpy).toBeCalledWith('whyyy?');
  });

  it('has no parameters by default', () => {
    const bus = makeAppHookBus();

    expect(bus.getParameters()).toBeNull();
  });

  it('allows to set parameters', () => {
    const bus = makeAppHookBus();

    bus.setParameters({ test: true });

    expect(bus.getParameters()).toEqual({ test: true });
  });

  it('defaults for empty parameters', () => {
    const bus = makeAppHookBus();

    bus.setParameters(undefined);

    expect(bus.getParameters()).toEqual({});
  });

  it('allows to unset parameters', () => {
    const bus = makeAppHookBus();

    bus.setParameters({ hello: 'world' });
    expect(bus.getParameters()).toEqual({ hello: 'world' });

    bus.unsetParameters();
    expect(bus.getParameters()).toBeNull();
  });
});
