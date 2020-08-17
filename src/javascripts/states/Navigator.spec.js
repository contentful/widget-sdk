import { getModule } from 'core/NgRegistry';
import { go, reloadWithEnvironment } from './Navigator';
import { when } from 'jest-when';

jest.mock('core/NgRegistry', () => ({ getModule: jest.fn() }));

describe('Navigator', () => {
  describe('go', () => {
    let goMock;

    beforeEach(() => {
      goMock = jest.fn();
      when(getModule).calledWith('$state').mockReturnValue({ go: goMock });
    });

    it('should trigger a new navigation state with string path', () => {
      go({ path: 'home' });
      expect(goMock).toHaveBeenCalledWith('home', undefined, undefined);
    });

    it('should trigger a new navigation state with array path', () => {
      go({ path: ['home', 'detail'] });
      expect(goMock).toHaveBeenCalledWith('home.detail', undefined, undefined);
    });

    it('should trigger a new navigation state with params', () => {
      go({ path: 'home', params: { foo: 'bar' } });
      expect(goMock).toHaveBeenCalledWith('home', { foo: 'bar' }, undefined);
    });

    it('should trigger a new navigation state with options', () => {
      go({ path: 'home', options: { foo: 'bar' } });
      expect(goMock).toHaveBeenCalledWith('home', undefined, { foo: 'bar' });
    });
  });

  describe('reloadWithEnvironment', () => {
    let goMock;
    let reloadMock;
    let broadcastMock;

    let current = () => ({ name: 'home' });

    beforeEach(() => {
      goMock = jest.fn();
      reloadMock = jest.fn();
      broadcastMock = jest.fn();
      when(getModule)
        .calledWith('$state')
        .mockReturnValue({ go: goMock, reload: reloadMock, current, params: {} });
      when(getModule).calledWith('$rootScope').mockReturnValue({ $broadcast: broadcastMock });
    });

    it('should reload to path if no env id given', async () => {
      await reloadWithEnvironment();
      expect(goMock).not.toHaveBeenCalled();
      expect(reloadMock).toHaveBeenCalled();
    });

    it('should trigger state change for spaces.detail with no env id given', async () => {
      current = { name: 'spaces.detail' };
      when(getModule)
        .calledWith('$state')
        .mockReturnValue({ go: goMock, reload: reloadMock, current, params: {} });
      await reloadWithEnvironment();
      expect(goMock).toHaveBeenCalledWith('spaces.detail', {}, { inherit: false, reload: true });
      expect(broadcastMock).toHaveBeenCalledWith('$locationChangeSuccess');
      expect(broadcastMock).toHaveBeenCalledWith('$stateChangeSuccess', { name: 'spaces.detail' });
    });

    it('should trigger state change for spaces.detail.environment with no env id given', async () => {
      current = { name: 'spaces.detail.environment' };
      when(getModule)
        .calledWith('$state')
        .mockReturnValue({
          go: goMock,
          reload: reloadMock,
          current,
          params: { environmentId: '123' },
        });
      await reloadWithEnvironment();
      expect(goMock).toHaveBeenCalledWith('spaces.detail', {}, { inherit: false, reload: true });
      expect(broadcastMock).toHaveBeenCalledWith('$locationChangeSuccess');
      expect(broadcastMock).toHaveBeenCalledWith('$stateChangeSuccess', { name: 'spaces.detail' });
      expect(getModule('$state').params.environmentId).toBeUndefined();
    });

    it('should trigger state change for spaces.detail with env id given', async () => {
      current = { name: 'spaces.detail' };
      when(getModule)
        .calledWith('$state')
        .mockReturnValue({ go: goMock, reload: reloadMock, current, params: {} });
      await reloadWithEnvironment('123');
      expect(goMock).toHaveBeenCalledWith(
        'spaces.detail.environment',
        { environmentId: '123' },
        {
          inherit: false,
          reload: true,
        }
      );
      expect(broadcastMock).toHaveBeenCalledWith('$locationChangeSuccess');
      expect(broadcastMock).toHaveBeenCalledWith('$stateChangeSuccess', {
        name: 'spaces.detail.environment',
      });
    });
  });
});
