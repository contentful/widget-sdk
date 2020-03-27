import makePageExtensionHandlers from './makePageExtensionHandlers';
import * as Navigator from 'states/Navigator';

jest.mock('states/Navigator', () => ({
  go: jest.fn((x) => Promise.resolve(x)),
}));

describe('makePageExtensionHandlers', () => {
  let spaceContext;

  beforeEach(() => {
    spaceContext = {
      getId: () => 'space-id',
      getEnvironmentId: jest.fn(() => 'master'),
      isMasterEnvironment: jest.fn(() => true),
    };
  });

  it('should throw if no id is passed', async () => {
    const navigate = makePageExtensionHandlers({ spaceContext }, 'extension-id');
    let error;

    try {
      await navigate();
    } catch (e) {
      error = e;
    }

    expect(error).toEqual(new Error('The `id` option is required!'));
  });

  it('should throw if path doesnt have a beginning slash', async () => {
    const navigate = makePageExtensionHandlers({ spaceContext }, 'extension-id');
    let error;

    try {
      await navigate({ id: 'test-id', path: 'test' });
    } catch (e) {
      error = e;
    }

    expect(error).toEqual(new Error('The `path` option must start with a slash!'));
  });

  it('should return the correct navigation object', async () => {
    const navigate = makePageExtensionHandlers({ spaceContext }, 'extension-id');

    const result = await navigate({ id: 'extension-id' });

    expect(result).toEqual({ navigated: true, path: undefined });
  });

  it('should create the correct master path', async () => {
    const navigate = makePageExtensionHandlers({ spaceContext }, 'extension-id');

    await navigate({ id: 'extension-id' });

    expect(Navigator.go).toHaveBeenCalledWith({
      options: {
        notify: true,
      },
      params: {
        environmentId: 'master',
        extensionId: 'extension-id',
        path: '',
        spaceId: 'space-id',
      },
      path: ['spaces', 'detail', 'pageExtensions'],
    });
  });

  it('should NOT notify if currentExtensionId is the same and on the page extension page', async () => {
    const navigate = makePageExtensionHandlers({ spaceContext }, 'extension-id', true);

    await navigate({ id: 'extension-id' });

    expect(Navigator.go).toHaveBeenCalledWith({
      options: {
        notify: false,
      },
      params: {
        environmentId: 'master',
        extensionId: 'extension-id',
        path: '',
        spaceId: 'space-id',
      },
      path: ['spaces', 'detail', 'pageExtensions'],
    });
  });

  it('should create the correct master path with params', async () => {
    const navigate = makePageExtensionHandlers({ spaceContext }, 'extension-id');

    await navigate({ id: 'extension-id', path: '/settings' });

    expect(Navigator.go).toHaveBeenCalledWith({
      options: {
        notify: true,
      },
      params: {
        environmentId: 'master',
        extensionId: 'extension-id',
        path: '/settings',
        spaceId: 'space-id',
      },
      path: ['spaces', 'detail', 'pageExtensions'],
    });
  });

  it('should create the correct environment path', async () => {
    spaceContext.getEnvironmentId.mockReturnValueOnce('testEnv');
    spaceContext.isMasterEnvironment.mockReturnValueOnce(false);

    const navigate = makePageExtensionHandlers({ spaceContext }, 'extension-id');

    await navigate({ id: 'extension-id-env', path: '/settings' });

    expect(Navigator.go).toHaveBeenCalledWith({
      options: {
        notify: true,
      },
      params: {
        environmentId: 'testEnv',
        extensionId: 'extension-id-env',
        path: '/settings',
        spaceId: 'space-id',
      },
      path: ['spaces', 'detail', 'environment', 'pageExtensions'],
    });
  });
});
