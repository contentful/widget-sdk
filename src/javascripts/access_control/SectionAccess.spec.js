import { getFirstAccessibleSref } from './SectionAccess';
import { getSectionVisibility } from 'access_control/AccessChecker';
import { routes } from '../core/react-routing';

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
  const AccessChecker = jest.requireActual('access_control/AccessChecker');

  return {
    ...AccessChecker,
    getSectionVisibility: jest.fn(() => mockAllTrue),
  };
});

const adminSpace = {
  data: {
    spaceMember: {
      admin: true,
      roles: [],
    },
    activatedAt: null,
  },
};

const adminActivatedSpace = {
  data: {
    spaceMember: {
      admin: true,
      roles: [],
    },
    activatedAt: 'activatedAt',
  },
};

const customRoleSpace = {
  data: {
    spaceMember: {
      admin: false,
      roles: [{ name: 'Custom' }],
    },
    activatedAt: 'activatedAt',
  },
};

const authorSpace = {
  data: {
    spaceMember: {
      admin: false,
      roles: [{ name: 'Author' }],
    },
    activatedAt: 'activatedAt',
  },
};

describe('#getFirstAccessibleSref', () => {
  it('handles all-true scenario', () => {
    expect(getFirstAccessibleSref(customRoleSpace).path).toBe('spaces.detail.entries.list');
  });

  it('handles some-true scenario', () => {
    getSectionVisibility.mockImplementationOnce(() => ({
      ...mockAllTrue,
      entry: false,
    }));
    const sref = getFirstAccessibleSref(customRoleSpace);
    expect(sref.path).toBe('spaces.detail.content_types');
    expect(sref.params).toEqual({ pathname: '/' });
  });

  it('handles all-false scenario', () => {
    getSectionVisibility.mockImplementationOnce(() => ({}));
    expect(getFirstAccessibleSref(customRoleSpace)).toBeNull();
  });

  it('handles all-false scenario with extra key', () => {
    getSectionVisibility.mockImplementationOnce(() => ({ extra: true }));
    expect(getFirstAccessibleSref(customRoleSpace)).toBeNull();
  });

  it('returns home screen sref when not activated and admin', () => {
    expect(getFirstAccessibleSref(adminSpace).path).toBe('.home');
  });

  it('returns first available screen sref when activated and admin', () => {
    expect(getFirstAccessibleSref(adminActivatedSpace).path).toBe('spaces.detail.entries.list');
  });

  it('returns home screen sref when user is author or editor', () => {
    expect(getFirstAccessibleSref(authorSpace).path).toBe('.home');
  });

  it('returns users list screen sref in form generated by react-router', () => {
    getSectionVisibility.mockImplementationOnce(() => ({
      contentType: false,
      entry: false,
      asset: false,
      apiKey: false,
      settings: true,
    }));
    expect(getFirstAccessibleSref(customRoleSpace)).toEqual(
      routes['users.list']({ withEnvironment: false })
    );
  });
});
