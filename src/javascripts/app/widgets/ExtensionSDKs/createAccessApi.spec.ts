import { createAccessApi } from './createAccessApi';
import * as AccessChecker from 'access_control/AccessChecker';

jest.mock('access_control/AccessChecker');

describe('createAccessApi', () => {
  describe('can', () => {
    const accessApi = createAccessApi(async () => {
      return {};
    });
    describe('when allowed', () => {
      it('resolves to true', async () => {
        (AccessChecker.getSpaceAuthContext as jest.Mock).mockReturnValue({ can: () => true });
        const result = await accessApi.can('create', 'ContentType');
        expect(result).toEqual(true);
      });
    });
    describe('when not allowed', () => {
      it('resolves to false', async () => {
        (AccessChecker.getSpaceAuthContext as jest.Mock).mockReturnValue({ can: () => false });
        const result = await accessApi.can('create', 'ContentType');
        expect(result).toEqual(false);
      });

      it('should throw when the action is not allowed', async () => {
        await expect(accessApi.can('notAllowed' as any, 'ContentType')).rejects.toThrowError(
          'Action not supported'
        );
      });

      it('should throw when the entity is not allowed', async () => {
        await expect(accessApi.can('update', 'AppKey')).rejects.toThrowError(
          'Entity type not supported'
        );
      });

      it('should throw if an invalid entity object is passed', async () => {
        await expect(accessApi.can('update', [1, 2, 4])).rejects.toThrowError(
          'Entity type not supported'
        );
      });

      it('should throw if an invalid entity object is allowed', async () => {
        await expect(accessApi.can('update', { sys: { type: 'Extension' } })).rejects.toThrowError(
          'Entity type not supported'
        );
      });
    });

    describe('when checking Entity update', () => {
      const entity = {
        sys: { type: 'Entry', id: 'random-id' },
        fields: { title: 'my title', body: 'my body' },
      };
      const checkedEntity = {
        sys: { type: 'Entry', id: 'random-id' },
        fields: { title: 'my title', body: 'new body' },
      };
      const accessApi = createAccessApi(async () => entity);

      it('should resolve true when action is allowed', async () => {
        (AccessChecker.getSpaceAuthContext as jest.Mock).mockReturnValueOnce({
          can: (action, existingEntity, patch) => {
            expect(action).toEqual('update');
            expect(existingEntity).toEqual(entity);
            expect(patch).toEqual([{ op: 'replace', path: '/fields/body', value: 'new body' }]);
            return true;
          },
        });

        const hasAccess = await accessApi.can('update', checkedEntity);
        expect(hasAccess).toBe(true);
      });

      it('should resolve false when action is not allowed', async () => {
        (AccessChecker.getSpaceAuthContext as jest.Mock).mockReturnValueOnce({
          can: (action, existingEntity, patch) => {
            expect(action).toEqual('update');
            expect(existingEntity).toEqual(entity);
            expect(patch).toEqual([{ op: 'replace', path: '/fields/body', value: 'new body' }]);

            return false;
          },
        });

        const hasAccess = await accessApi.can('update', checkedEntity);
        expect(hasAccess).toBe(false);
      });
    });
  });

  describe('canEditAppConfig', () => {
    const accessApi = createAccessApi(async () => ({}));
    describe('when allowed', () => {
      it('returns true', async () => {
        (AccessChecker.getSpaceAuthContext as jest.Mock).mockReturnValue({
          can: (action, entity) => action === AccessChecker.Action.UPDATE && entity === 'settings',
        });
        const result = await accessApi.canEditAppConfig();
        expect(result).toEqual(true);
      });
    });

    describe('when not allowed', () => {
      it('returns false', async () => {
        (AccessChecker.getSpaceAuthContext as jest.Mock).mockReturnValue({ can: () => false });
        const result = await accessApi.canEditAppConfig();
        expect(result).toEqual(false);
      });
    });
  });
});
