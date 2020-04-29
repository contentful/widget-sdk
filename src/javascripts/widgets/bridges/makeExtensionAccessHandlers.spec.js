import makeExtensionAccessHandlers from './makeExtensionAccessHandlers';
import * as AccessChecker from 'access_control/AccessChecker';

jest.mock('access_control/AccessChecker', () => ({
  can: jest.fn(),
  Action: {
    CREATE: 'create',
    UPDATE: 'update',
  },
}));

const checkAccess = makeExtensionAccessHandlers();

describe('makeExtensionAccessHandlers', () => {
  it('should throw when the action is not allowed', () => {
    expect(() => checkAccess('manage', 'ContentType')).toThrow(/action not supported/i);
  });

  it('should throw if entity type is not allowed', () => {
    expect(() => checkAccess('create', 'Extension')).toThrow(/type not supported/i);
  });

  it('should throw if entity object is not allowed', () => {
    expect(() => checkAccess('create', { sys: { type: 'Extension' } })).toThrow(
      /type not supported/i
    );
  });

  it('should throw if invalid entity object is passed', () => {
    expect(() => checkAccess('create', [1, 2, 3])).toThrow(/type not supported/i);
  });

  it('delegates to access checker', () => {
    AccessChecker.can.mockReturnValueOnce(true);
    expect(checkAccess('create', 'ContentType')).toBe(true);
    expect(AccessChecker.can).toHaveBeenCalledTimes(1);
    expect(AccessChecker.can).toHaveBeenCalledWith('create', 'ContentType');
  });
});
