import { makeAppHookBus } from './AppHookBus';

describe('AppHookBus', () => {
  const installation = {
    sys: {
      type: 'AppInstallation',
      appDefinition: {
        sys: {
          type: 'Link',
          linkType: 'AppDefinition',
          id: 'def'
        }
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

  it('has no installation by default', () => {
    const bus = makeAppHookBus();

    expect(bus.getInstallation()).toBeNull();
  });

  it('allows to set installation', () => {
    const bus = makeAppHookBus();

    bus.setInstallation(installation);

    expect(bus.getInstallation()).toEqual(installation);
  });

  it('defaults for empty parameters', () => {
    const bus = makeAppHookBus();

    const noParams = { ...installation };
    delete noParams.parameters;

    bus.setInstallation(noParams);

    expect(bus.getInstallation()).toEqual({
      ...noParams,
      parameters: {}
    });
  });

  it('allows to unset installation', () => {
    const bus = makeAppHookBus();

    bus.setInstallation(installation);
    expect(bus.getInstallation()).toEqual(installation);

    bus.setInstallation(null);
    expect(bus.getInstallation()).toBeNull();
  });
});
