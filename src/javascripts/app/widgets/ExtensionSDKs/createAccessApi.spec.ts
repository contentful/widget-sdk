import { createAccessApi } from './createAccessApi';
import * as AccessChecker from 'access_control/AccessChecker';

jest.mock('access_control/AccessChecker');

describe('createAccessApi', () => {
  describe('can', () => {
    const accessApi = createAccessApi();
    describe('when allowed', () => {
      it('resolves to true', async () => {
        (AccessChecker.can as jest.Mock).mockResolvedValue(true);
        const result = await accessApi.can('create', 'ContentType');
        expect(result).toEqual(true);
      });
    });
    describe('when not allowed', () => {
      it('resolves to false', async () => {
        (AccessChecker.can as jest.Mock).mockResolvedValue(false);
        const result = await accessApi.can('create', 'ContentType');
        expect(result).toEqual(false);
      });

      it('should throw when the action is not allowed', () => {
        expect(() => accessApi.can('notAllowed' as any, 'ContentType')).toThrow(
          'Action not supported'
        );
      });

      it('should throw when the entity is not allowed', () => {
        expect(() => accessApi.can('update', 'AppKey')).toThrow('Entity type not supported');
      });

      it('should throw if an invalid entity object is passed', () => {
        expect(() => accessApi.can('update', [1, 2, 4])).toThrow('Entity type not supported');
      });

      it('should throw if an invalid entity object is allowed', () => {
        expect(() => accessApi.can('update', { sys: { type: 'Extension' } })).toThrow(
          'Entity type not supported'
        );
      });
    });
  });

  describe('canEditAppConfig', () => {
    const accessApi = createAccessApi();
    describe('when allowed', () => {
      it('returns true', () => {
        (AccessChecker.can as jest.Mock).mockImplementationOnce(
          (action, entity) => action === AccessChecker.Action.UPDATE && entity === 'settings'
        );
        const result = (accessApi as any).canEditAppConfig();
        expect(result).toEqual(true);
      });
    });

    describe('when not allowed', () => {
      it('returns false', () => {
        (AccessChecker.can as jest.Mock).mockReturnValue(false);
        const result = (accessApi as any).canEditAppConfig();
        expect(result).toEqual(false);
      });
    });
  });
});
