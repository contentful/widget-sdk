import { makeAppHookBus } from './AppHookBus';

describe('AppHookBus', () => {
  const extension = {
    sys: { type: 'Extension', id: 'ext' },
    extensionDefinition: {
      sys: {
        type: 'Link',
        linkType: 'extensionDefinition',
        id: 'def'
      }
    },
    parameters: { test: true }
  };

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

  it('has no extension by default', () => {
    const bus = makeAppHookBus();

    expect(bus.getExtension()).toBeNull();
  });

  it('allows to set extension', () => {
    const bus = makeAppHookBus();

    bus.setExtension(extension);

    expect(bus.getExtension()).toEqual(extension);
  });

  it('defaults for empty parameters', () => {
    const bus = makeAppHookBus();

    const noParams = { ...extension };
    delete noParams.parameters;

    bus.setExtension(noParams);

    expect(bus.getExtension()).toEqual({
      ...noParams,
      parameters: {}
    });
  });

  it('allows to unset extension', () => {
    const bus = makeAppHookBus();

    bus.setExtension(extension);
    expect(bus.getExtension()).toEqual(extension);

    bus.setExtension(null);
    expect(bus.getExtension()).toBeNull();
  });
});
