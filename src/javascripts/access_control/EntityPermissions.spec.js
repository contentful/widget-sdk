import { create } from './EntityPermissions';
import * as accessChecker from 'access_control/AccessChecker/index';

jest.mock('access_control/AccessChecker', () => ({
  canPerformActionOnEntity: jest.fn(),
  canUpdateEntry: jest.fn(),
  canUpdateAsset: jest.fn(),
  canEditFieldLocale: jest.fn(),
}));

const entrySys = { type: 'Entry', id: 'some-entry-id' };
const assetSys = { type: 'Asset', id: 'some-asset-id' };
const emptyEntity = (sys) => ({ data: { sys } });

describe('EntityPermissions', () => {
  let permissions;

  beforeEach(() => {
    permissions = create(entrySys);
  });

  describe('#can()', () => {
    it('delegates to `accessChecker.canPerformActionOnEntity()`', () => {
      accessChecker.canPerformActionOnEntity.mockReturnValue(true);
      expect(permissions.can('publish')).toBe(true);

      accessChecker.canPerformActionOnEntity.mockReturnValue(false);
      expect(permissions.can('publish')).toBe(false);

      expect(accessChecker.canPerformActionOnEntity).toHaveBeenCalledTimes(2);
      expect(accessChecker.canPerformActionOnEntity).toHaveBeenCalledWith(
        'publish',
        emptyEntity(entrySys)
      );
    });

    it('delegates "update" calls to `accessChecker.canUpdateEntry()`', () => {
      accessChecker.canUpdateEntry.mockReturnValue(true);
      expect(permissions.can('update')).toBe(true);

      accessChecker.canUpdateEntry.mockReturnValue(false);
      expect(permissions.can('update')).toBe(false);

      expect(accessChecker.canUpdateEntry).toHaveBeenCalledTimes(2);
      expect(accessChecker.canUpdateEntry).toHaveBeenCalledWith(emptyEntity(entrySys));
    });

    it('delegates "update" calls to `accessChecker.canUpdateAsset()`', () => {
      permissions = create(assetSys);

      accessChecker.canUpdateAsset.mockReturnValue(true);
      expect(permissions.can('update')).toBe(true);

      accessChecker.canUpdateAsset.mockReturnValue(false);
      expect(permissions.can('update')).toBe(false);

      expect(accessChecker.canUpdateAsset).toHaveBeenCalledTimes(2);
      expect(accessChecker.canUpdateAsset).toHaveBeenCalledWith(emptyEntity(assetSys));
    });

    it('throws when action is unknown', () => {
      expect(() => permissions.can('rule the world')).toThrowError(
        'Unknown entity action "rule the world"'
      );
    });
  });

  describe('#canEditFieldLocale()', () => {
    it('returns false if `update` permission is denied', () => {
      accessChecker.canUpdateEntry.mockReturnValue(false);

      expect(permissions.canEditFieldLocale('FIELD', 'LOCALE')).toBe(false);
      expect(accessChecker.canUpdateEntry).toHaveBeenCalledTimes(1);
      expect(accessChecker.canUpdateEntry).toHaveBeenCalledWith(emptyEntity(entrySys));
    });

    it('delegates to `policyAccessChecker`', () => {
      accessChecker.canUpdateEntry.mockReturnValue(true);

      accessChecker.canEditFieldLocale.mockReturnValue(true);
      expect(permissions.canEditFieldLocale('FIELD', 'LOCALE')).toBe(true);

      accessChecker.canEditFieldLocale.mockReturnValue(false);
      expect(permissions.canEditFieldLocale('FIELD', 'LOCALE')).toBe(false);

      expect(accessChecker.canEditFieldLocale).toHaveBeenCalledTimes(2);
      expect(accessChecker.canEditFieldLocale).toHaveBeenCalledWith(
        entrySys,
        { apiName: 'FIELD' },
        { code: 'LOCALE' }
      );
    });
  });
});
