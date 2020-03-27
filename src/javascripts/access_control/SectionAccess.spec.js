import { getFirstAccessibleSref } from './SectionAccess';
import { getSectionVisibility } from 'access_control/AccessChecker';
import * as spaceContextMocked from 'ng/spaceContext';

const mockAllTrue = {
  contentType: true,
  entry: true,
  asset: true,
  apiKey: true,
  settings: true,
};

jest.mock('access_control/AccessChecker', () => {
  // Importing the default module here in order to not overwrite the whole
  // thing when mocking `getSectionVisibility`. Because SectionAccess relies on
  // other functions in this file.
  const AccessChecker = require.requireActual('access_control/AccessChecker');

  return {
    ...AccessChecker,
    getSectionVisibility: jest.fn(() => mockAllTrue),
  };
});

describe('#getFirstAccessibleSref', () => {
  it('handles all-true scenario', () => {
    expect(getFirstAccessibleSref()).toBe('.entries.list');
  });

  it('handles some-true scenario', () => {
    getSectionVisibility.mockImplementationOnce(() => ({
      ...mockAllTrue,
      entry: false,
    }));
    expect(getFirstAccessibleSref()).toBe('.content_types.list');
  });

  it('handles all-false scenario', () => {
    getSectionVisibility.mockImplementationOnce(() => ({}));
    expect(getFirstAccessibleSref()).toBeNull();
  });

  it('handles all-false scenario with extra key', () => {
    getSectionVisibility.mockImplementationOnce(() => ({ extra: true }));
    expect(getFirstAccessibleSref()).toBeNull();
  });

  it('returns home screen sref when not activated and admin', () => {
    spaceContextMocked.getData.mockImplementation((key) => {
      if (key === 'spaceMember.admin') {
        return true;
      }
      if (key === 'activatedAt') {
        return null;
      }
    });

    expect(getFirstAccessibleSref()).toBe('.home');
    expect(spaceContextMocked.getData).toHaveBeenCalledTimes(3);
  });

  it('returns first available screen sref when activated and admin', () => {
    spaceContextMocked.getData.mockImplementation((key) => {
      if (key === 'spaceMember.admin') {
        return true;
      }
      if (key === 'activatedAt') {
        return 'activatedAt';
      }
    });

    expect(getFirstAccessibleSref()).toBe('.entries.list');
    expect(spaceContextMocked.getData).toHaveBeenCalledTimes(3);
  });

  it('returns home screen sref when user is author or editor', () => {
    spaceContextMocked.getData.mockImplementation((key) => {
      if (key === 'spaceMember.roles') {
        return [{ name: 'Author' }];
      }
      if (key === 'activatedAt') {
        return 'activatedAt';
      }
    });

    expect(getFirstAccessibleSref()).toBe('.home');
    expect(spaceContextMocked.getData).toHaveBeenCalledTimes(3);
  });
});
