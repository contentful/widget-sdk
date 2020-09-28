import { create } from './EntityPermissions';
import * as accessChecker from 'access_control/AccessChecker/index';

jest.mock('access_control/AccessChecker', () => ({
  canPerformActionOnEntity: jest.fn(),
  canUpdateEntry: jest.fn(),
  canUpdateAsset: jest.fn(),
  canEditFieldLocale: jest.fn(),
}));

const entry = {
  sys: { type: 'Entry', id: 'some-entry-id' },
  metadata: { tags: [] },
};
const asset = {
  sys: { type: 'Asset', id: 'some-asset-id' },
  metadata: { tags: [] },
};
const emptyEntity = (entity) => ({ data: { sys: entity.sys, metadata: entity.metadata } });

describe('EntityPermissions', () => {
  let permissions;

  beforeEach(() => {
    permissions = create(entry);
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
        emptyEntity(entry)
      );
    });

    it('delegates "update" calls to `accessChecker.canUpdateEntry()`', () => {
      accessChecker.canUpdateEntry.mockReturnValue(true);
      expect(permissions.can('update')).toBe(true);

      accessChecker.canUpdateEntry.mockReturnValue(false);
      expect(permissions.can('update')).toBe(false);

      expect(accessChecker.canUpdateEntry).toHaveBeenCalledTimes(2);
      expect(accessChecker.canUpdateEntry).toHaveBeenCalledWith(emptyEntity(entry));
    });

    it('delegates "update" calls to `accessChecker.canUpdateAsset()`', () => {
      permissions = create(asset);

      accessChecker.canUpdateAsset.mockReturnValue(true);
      expect(permissions.can('update')).toBe(true);

      accessChecker.canUpdateAsset.mockReturnValue(false);
      expect(permissions.can('update')).toBe(false);

      expect(accessChecker.canUpdateAsset).toHaveBeenCalledTimes(2);
      expect(accessChecker.canUpdateAsset).toHaveBeenCalledWith(emptyEntity(asset));
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
      expect(accessChecker.canUpdateEntry).toHaveBeenCalledWith(emptyEntity(entry));
    });

    it('delegates to `policyAccessChecker`', () => {
      accessChecker.canUpdateEntry.mockReturnValue(true);

      accessChecker.canEditFieldLocale.mockReturnValue(true);
      expect(permissions.canEditFieldLocale('FIELD', 'LOCALE')).toBe(true);

      accessChecker.canEditFieldLocale.mockReturnValue(false);
      expect(permissions.canEditFieldLocale('FIELD', 'LOCALE')).toBe(false);

      expect(accessChecker.canEditFieldLocale).toHaveBeenCalledTimes(2);
      expect(accessChecker.canEditFieldLocale).toHaveBeenCalledWith(
        entry.sys,
        { apiName: 'FIELD' },
        { code: 'LOCALE' }
      );
    });
  });
});
